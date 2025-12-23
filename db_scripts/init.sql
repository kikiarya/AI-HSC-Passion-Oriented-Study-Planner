-- =========
-- 1) Roles & links
-- =========

-- Role enum & mapping (profiles can have multiple roles)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_type') then
    create type role_type as enum ('student','teacher','parent','admin');
  end if;
end$$;

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role role_type not null,
  created_at timestamptz default now(),
  primary key (profile_id, role)
);

-- Teachers assigned to classes (supports co-teaching)
create table if not exists public.class_teachers (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  class_id  uuid not null references public.classes(id) on delete cascade,
  role_in_class text default 'teacher', -- 'owner','assistant', etc.
  created_at timestamptz default now(),
  primary key (profile_id, class_id)
);
create index if not exists class_teachers_class_idx   on public.class_teachers (class_id);
create index if not exists class_teachers_profile_idx on public.class_teachers (profile_id);

-- Parent ↔ Student links (guardianships)
create table if not exists public.guardianships (
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  relationship text,
  created_at timestamptz default now(),
  primary key (parent_id, student_id)
);
create index if not exists guardianships_parent_idx  on public.guardianships (parent_id);
create index if not exists guardianships_student_idx on public.guardianships (student_id);

-- Enable RLS on new tables
alter table public.profile_roles   enable row level security;
alter table public.class_teachers  enable row level security;
alter table public.guardianships   enable row level security;

-- Minimal RLS on the link tables (only see your own “authority” rows; admins via function below)
create policy if not exists "profile_roles_select_self_or_admin"
  on public.profile_roles for select
  to authenticated
  using (profile_id = auth.uid() or public.is_admin());

create policy if not exists "class_teachers_select_self_or_admin"
  on public.class_teachers for select
  to authenticated
  using (profile_id = auth.uid() or public.is_admin());

create policy if not exists "guardianships_select_parent_or_admin"
  on public.guardianships for select
  to authenticated
  using (parent_id = auth.uid() or public.is_admin());

-- (Optionally restrict inserts/updates on these link tables to admins only)
create policy if not exists "profile_roles_admin_manage"
  on public.profile_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "class_teachers_admin_manage"
  on public.class_teachers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "guardianships_admin_manage"
  on public.guardianships for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =========
-- 2) Helper functions (SECURITY DEFINER) for RLS predicates
-- =========

-- Admin override: either service_role JWT or a stored 'admin' role
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((auth.jwt()->>'role') = 'service_role', false)
      or exists (
        select 1 from public.profile_roles r
        where r.profile_id = auth.uid() and r.role = 'admin'
      );
$$;
grant execute on function public.is_admin() to authenticated;

-- Is current user a teacher of a given class?
create or replace function public.is_class_teacher(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
           select 1 from public.class_teachers ct
           where ct.class_id = p_class_id
             and ct.profile_id = auth.uid()
         )
         or public.is_admin();
$$;
grant execute on function public.is_class_teacher(uuid) to authenticated;

-- Is current user a guardian of a given student?
create or replace function public.is_guardian_of(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
           select 1 from public.guardianships g
           where g.parent_id = auth.uid()
             and g.student_id = p_student_id
         )
         or public.is_admin();
$$;
grant execute on function public.is_guardian_of(uuid) to authenticated;

-- Is current user a teacher for the class that owns an assignment?
create or replace function public.is_assignment_in_teacher_class(p_assignment_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
           select 1
           from public.assignments a
           join public.class_teachers ct on ct.class_id = a.class_id
           where a.id = p_assignment_id
             and ct.profile_id = auth.uid()
         )
         or public.is_admin();
$$;
grant execute on function public.is_assignment_in_teacher_class(uuid) to authenticated;

-- Is current user a teacher for the class that owns a submission?
create or replace function public.is_submission_in_teacher_class(p_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
           select 1
           from public.assignment_submissions s
           join public.assignments a on a.id = s.assignment_id
           join public.class_teachers ct on ct.class_id = a.class_id
           where s.id = p_submission_id
             and ct.profile_id = auth.uid()
         )
         or public.is_admin();
$$;
grant execute on function public.is_submission_in_teacher_class(uuid) to authenticated;

-- Is current user a guardian of the student who owns a submission?
create or replace function public.is_submission_of_guardian(p_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
           select 1
           from public.assignment_submissions s
           join public.guardianships g
             on g.student_id = s.student_id
           where s.id = p_submission_id
             and g.parent_id = auth.uid()
         )
         or public.is_admin();
$$;
grant execute on function public.is_submission_of_guardian(uuid) to authenticated;

-- =========
-- 3) Policy extensions for Teacher / Parent / Admin
--    (adds to your existing student-focused policies)
-- =========

-- CLASSES
-- (You already allow all authenticated to read; keep as is or tighten if desired.)

-- ENROLLMENTS: teachers can read their class rosters; parents can view child rows; admins manage
create policy if not exists "enrollments_select_if_teacher_or_parent_or_admin"
  on public.enrollments for select
  to authenticated
  using (
    public.is_class_teacher(class_id)
    or public.is_guardian_of(student_id)
    or public.is_admin()
  );

-- Allow teachers/admins to enroll students into their classes (optional)
create policy if not exists "enrollments_insert_by_teacher_or_admin"
  on public.enrollments for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

-- CLASS MATERIALS: teacher full CRUD on their classes; parents read via child enrollment
create policy if not exists "materials_select_teacher_or_parent"
  on public.class_materials for select
  to authenticated
  using (
    public.is_class_teacher(class_id)
    or exists (
      select 1 from public.enrollments e
      join public.guardianships g on g.student_id = e.student_id
      where e.class_id = class_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

create policy if not exists "materials_crud_teacher_or_admin_insert"
  on public.class_materials for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

create policy if not exists "materials_crud_teacher_or_admin_update"
  on public.class_materials for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

create policy if not exists "materials_crud_teacher_or_admin_delete"
  on public.class_materials for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- CLASS SESSIONS (schedule)
create policy if not exists "sessions_select_teacher_or_parent"
  on public.class_schedule_sessions for select
  to authenticated
  using (
    public.is_class_teacher(class_id)
    or exists (
      select 1 from public.enrollments e
      join public.guardianships g on g.student_id = e.student_id
      where e.class_id = class_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

create policy if not exists "sessions_crud_teacher_or_admin_insert"
  on public.class_schedule_sessions for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

create policy if not exists "sessions_crud_teacher_or_admin_update"
  on public.class_schedule_sessions for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

create policy if not exists "sessions_crud_teacher_or_admin_delete"
  on public.class_schedule_sessions for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- ASSIGNMENTS
create policy if not exists "assignments_select_if_teacher_or_parent"
  on public.assignments for select
  to authenticated
  using (
    public.is_class_teacher(class_id)
    or exists (
      select 1 from public.enrollments e
      join public.guardianships g on g.student_id = e.student_id
      where e.class_id = class_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

create policy if not exists "assignments_crud_teacher_or_admin_insert"
  on public.assignments for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

create policy if not exists "assignments_crud_teacher_or_admin_update"
  on public.assignments for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

create policy if not exists "assignments_crud_teacher_or_admin_delete"
  on public.assignments for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- ASSIGNMENT SUB-TABLES (instructions/requirements/resources/rubric/questions/options)
-- Teachers: full CRUD via assignment ownership; Parents: read via child enrollment
create policy if not exists "ai_select_teacher_or_parent"
  on public.assignment_instructions for select
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id)
          or exists (
               select 1 from public.assignments a
               join public.enrollments e on e.class_id = a.class_id
               join public.guardianships g on g.student_id = e.student_id
               where a.id = assignment_id and g.parent_id = auth.uid()
             )
          or public.is_admin() );

create policy if not exists "ai_crud_teacher_or_admin_insert"
  on public.assignment_instructions for insert
  to authenticated
  with check ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "ai_crud_teacher_or_admin_update"
  on public.assignment_instructions for update
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "ai_crud_teacher_or_admin_delete"
  on public.assignment_instructions for delete
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );

-- Repeat for requirements/resources/rubric/questions/options
create policy if not exists "ar_select_teacher_or_parent"
  on public.assignment_requirements for select
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id)
          or exists (
               select 1 from public.assignments a
               join public.enrollments e on e.class_id = a.class_id
               join public.guardianships g on g.student_id = e.student_id
               where a.id = assignment_id and g.parent_id = auth.uid()
             )
          or public.is_admin() );
create policy if not exists "ar_crud_teacher_or_admin_insert"
  on public.assignment_requirements for insert
  to authenticated
  with check ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "ar_crud_teacher_or_admin_update"
  on public.assignment_requirements for update
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "ar_crud_teacher_or_admin_delete"
  on public.assignment_requirements for delete
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );

create policy if not exists "ares_select_teacher_or_parent"
  on public.assignment_resources for select
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id)
          or exists (
               select 1 from public.assignments a
               join public.enrollments e on e.class_id = a.class_id
               join public.guardianships g on g.student_id = e.student_id
               where a.id = assignment_id and g.parent_id = auth.uid()
             )
          or public.is_admin() );
create policy if not exists "ares_crud_teacher_or_admin_insert"
  on public.assignment_resources for insert
  to authenticated
  with check ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "ares_crud_teacher_or_admin_update"
  on public.assignment_resources for update
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "ares_crud_teacher_or_admin_delete"
  on public.assignment_resources for delete
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );

create policy if not exists "rubric_select_teacher_or_parent"
  on public.assignment_rubric_items for select
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id)
          or exists (
               select 1 from public.assignments a
               join public.enrollments e on e.class_id = a.class_id
               join public.guardianships g on g.student_id = e.student_id
               where a.id = assignment_id and g.parent_id = auth.uid()
             )
          or public.is_admin() );
create policy if not exists "rubric_crud_teacher_or_admin_insert"
  on public.assignment_rubric_items for insert
  to authenticated
  with check ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "rubric_crud_teacher_or_admin_update"
  on public.assignment_rubric_items for update
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "rubric_crud_teacher_or_admin_delete"
  on public.assignment_rubric_items for delete
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );

create policy if not exists "questions_select_teacher_or_parent"
  on public.assignment_questions for select
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id)
          or exists (
               select 1 from public.assignments a
               join public.enrollments e on e.class_id = a.class_id
               join public.guardianships g on g.student_id = e.student_id
               where a.id = assignment_id and g.parent_id = auth.uid()
             )
          or public.is_admin() );
create policy if not exists "questions_crud_teacher_or_admin_insert"
  on public.assignment_questions for insert
  to authenticated
  with check ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "questions_crud_teacher_or_admin_update"
  on public.assignment_questions for update
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );
create policy if not exists "questions_crud_teacher_or_admin_delete"
  on public.assignment_questions for delete
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );

create policy if not exists "options_select_teacher_or_parent"
  on public.assignment_question_options for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(
      (select q.assignment_id from public.assignment_questions q where q.id = question_id)
    )
    or exists (
      select 1
      from public.assignment_questions q
      join public.assignments a on a.id = q.assignment_id
      join public.enrollments e on e.class_id = a.class_id
      join public.guardianships g on g.student_id = e.student_id
      where q.id = question_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );
create policy if not exists "options_crud_teacher_or_admin_insert"
  on public.assignment_question_options for insert
  to authenticated
  with check (
    public.is_assignment_in_teacher_class(
      (select q.assignment_id from public.assignment_questions q where q.id = question_id)
    )
    or public.is_admin()
  );
create policy if not exists "options_crud_teacher_or_admin_update"
  on public.assignment_question_options for update
  to authenticated
  using (
    public.is_assignment_in_teacher_class(
      (select q.assignment_id from public.assignment_questions q where q.id = question_id)
    )
    or public.is_admin()
  );
create policy if not exists "options_crud_teacher_or_admin_delete"
  on public.assignment_question_options for delete
  to authenticated
  using (
    public.is_assignment_in_teacher_class(
      (select q.assignment_id from public.assignment_questions q where q.id = question_id)
    )
    or public.is_admin()
  );

-- GRADE HISTORY: students see own; teachers see/maintain class; parents see child
create policy if not exists "grade_history_select_teacher_or_parent_or_admin"
  on public.class_grade_history for select
  to authenticated
  using (
    public.is_guardian_of(student_id)
    or exists (
      select 1 from public.class_teachers ct
      where ct.class_id = class_id and ct.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy if not exists "grade_history_crud_teacher_or_admin_insert"
  on public.class_grade_history for insert
  to authenticated
  with check (
    public.is_class_teacher(class_id) or public.is_admin()
  );

create policy if not exists "grade_history_crud_teacher_or_admin_update"
  on public.class_grade_history for update
  to authenticated
  using ( public.is_class_teacher(class_id) or public.is_admin() );

create policy if not exists "grade_history_crud_teacher_or_admin_delete"
  on public.class_grade_history for delete
  to authenticated
  using ( public.is_class_teacher(class_id) or public.is_admin() );

-- SUBMISSIONS: already student-scoped; add teacher/parent read, and (optionally) teacher update
create policy if not exists "submissions_select_teacher_or_parent_or_admin"
  on public.assignment_submissions for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(assignment_id)
    or public.is_submission_of_guardian(id)
    or public.is_admin()
  );

-- (Optional) allow teachers/admins to update status fields (e.g., grading workflow)
create policy if not exists "submissions_update_teacher_or_admin"
  on public.assignment_submissions for update
  to authenticated
  using ( public.is_assignment_in_teacher_class(assignment_id) or public.is_admin() );

-- SUBMISSION ANSWERS: add teacher/parent read
create policy if not exists "submission_answers_select_teacher_or_parent_or_admin"
  on public.assignment_submission_answers for select
  to authenticated
  using (
    public.is_submission_in_teacher_class(submission_id)
    or public.is_submission_of_guardian(submission_id)
    or public.is_admin()
  );
