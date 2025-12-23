-- =========================================
-- POLICY PATCH 2 — ENABLE RLS + POLICIES
-- (assumes Patch 1 objects exist)
-- =========================================

-- 0) Enable RLS on all tables
alter table public.profiles                      enable row level security;
alter table public.classes                       enable row level security;
alter table public.enrollments                   enable row level security;
alter table public.class_materials               enable row level security;
alter table public.class_schedule_sessions       enable row level security;
alter table public.class_grade_history           enable row level security;
alter table public.assignments                   enable row level security;
alter table public.assignment_instructions       enable row level security;
alter table public.assignment_requirements       enable row level security;
alter table public.assignment_resources          enable row level security;
alter table public.assignment_rubric_items       enable row level security;
alter table public.assignment_questions          enable row level security;
alter table public.assignment_question_options   enable row level security;
alter table public.assignment_submissions        enable row level security;
alter table public.assignment_submission_answers enable row level security;

-- Link tables from Patch 1
alter table public.profile_roles                 enable row level security;
alter table public.class_teachers                enable row level security;
alter table public.guardianships                 enable row level security;

-- =========================================================
-- 1) profiles
-- =========================================================
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- =========================================================
-- 2) classes
-- =========================================================
drop policy if exists "classes_select_all_auth" on public.classes;
create policy "classes_select_all_auth"
  on public.classes for select
  to authenticated
  using (true);

drop policy if exists "classes_crud_teacher_or_admin_insert" on public.classes;
create policy "classes_crud_teacher_or_admin_insert"
  on public.classes for insert
  to authenticated
  with check (public.is_admin()); -- optional: allow only admins to create classes

drop policy if exists "classes_crud_teacher_or_admin_update" on public.classes;
create policy "classes_crud_teacher_or_admin_update"
  on public.classes for update
  to authenticated
  using (public.is_class_teacher(id) or public.is_admin());

drop policy if exists "classes_crud_teacher_or_admin_delete" on public.classes;
create policy "classes_crud_teacher_or_admin_delete"
  on public.classes for delete
  to authenticated
  using (public.is_admin()); -- destructive ops reserved for admins

-- =========================================================
-- 3) enrollments
-- =========================================================
drop policy if exists "enrollments_select_own" on public.enrollments;
create policy "enrollments_select_own"
  on public.enrollments for select
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "enrollments_select_if_teacher_or_parent_or_admin" on public.enrollments;
create policy "enrollments_select_if_teacher_or_parent_or_admin"
  on public.enrollments for select
  to authenticated
  using (
    public.is_class_teacher(class_id)
    or public.is_guardian_of(student_id)
    or public.is_admin()
  );

drop policy if exists "enrollments_insert_own" on public.enrollments;
create policy "enrollments_insert_own"
  on public.enrollments for insert
  to authenticated
  with check (student_id = auth.uid());

drop policy if exists "enrollments_insert_by_teacher_or_admin" on public.enrollments;
create policy "enrollments_insert_by_teacher_or_admin"
  on public.enrollments for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "enrollments_update_own" on public.enrollments;
create policy "enrollments_update_own"
  on public.enrollments for update
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "enrollments_update_teacher_or_admin" on public.enrollments;
create policy "enrollments_update_teacher_or_admin"
  on public.enrollments for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "enrollments_delete_own" on public.enrollments;
create policy "enrollments_delete_own"
  on public.enrollments for delete
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "enrollments_delete_teacher_or_admin" on public.enrollments;
create policy "enrollments_delete_teacher_or_admin"
  on public.enrollments for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- =========================================================
-- 4) class_materials
-- =========================================================
drop policy if exists "materials_select_if_enrolled" on public.class_materials;
create policy "materials_select_if_enrolled"
  on public.class_materials for select
  to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.class_id = class_id and e.student_id = auth.uid()
    )
    or public.is_class_teacher(class_id)
    or exists (
      select 1
      from public.enrollments e
      join public.guardianships g on g.student_id = e.student_id
      where e.class_id = class_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "materials_insert_teacher_or_admin" on public.class_materials;
create policy "materials_insert_teacher_or_admin"
  on public.class_materials for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "materials_update_teacher_or_admin" on public.class_materials;
create policy "materials_update_teacher_or_admin"
  on public.class_materials for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "materials_delete_teacher_or_admin" on public.class_materials;
create policy "materials_delete_teacher_or_admin"
  on public.class_materials for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- =========================================================
-- 5) class_schedule_sessions
-- =========================================================
drop policy if exists "schedule_select_if_enrolled" on public.class_schedule_sessions;
create policy "schedule_select_if_enrolled"
  on public.class_schedule_sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.class_id = class_id and e.student_id = auth.uid()
    )
    or public.is_class_teacher(class_id)
    or exists (
      select 1
      from public.enrollments e
      join public.guardianships g on g.student_id = e.student_id
      where e.class_id = class_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "sessions_insert_teacher_or_admin" on public.class_schedule_sessions;
create policy "sessions_insert_teacher_or_admin"
  on public.class_schedule_sessions for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "sessions_update_teacher_or_admin" on public.class_schedule_sessions;
create policy "sessions_update_teacher_or_admin"
  on public.class_schedule_sessions for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "sessions_delete_teacher_or_admin" on public.class_schedule_sessions;
create policy "sessions_delete_teacher_or_admin"
  on public.class_schedule_sessions for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- =========================================================
-- 6) class_grade_history
-- =========================================================
drop policy if exists "grade_history_select_own" on public.class_grade_history;
create policy "grade_history_select_own"
  on public.class_grade_history for select
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "grade_history_select_teacher_or_parent_or_admin" on public.class_grade_history;
create policy "grade_history_select_teacher_or_parent_or_admin"
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

drop policy if exists "grade_history_insert_teacher_or_admin" on public.class_grade_history;
create policy "grade_history_insert_teacher_or_admin"
  on public.class_grade_history for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "grade_history_update_teacher_or_admin" on public.class_grade_history;
create policy "grade_history_update_teacher_or_admin"
  on public.class_grade_history for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "grade_history_delete_teacher_or_admin" on public.class_grade_history;
create policy "grade_history_delete_teacher_or_admin"
  on public.class_grade_history for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- =========================================================
-- 7) assignments
-- =========================================================
drop policy if exists "assignments_select_if_enrolled" on public.assignments;
create policy "assignments_select_if_enrolled"
  on public.assignments for select
  to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.class_id = class_id and e.student_id = auth.uid()
    )
    or public.is_class_teacher(class_id)
    or exists (
      select 1
      from public.enrollments e
      join public.guardianships g on g.student_id = e.student_id
      where e.class_id = class_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "assignments_insert_teacher_or_admin" on public.assignments;
create policy "assignments_insert_teacher_or_admin"
  on public.assignments for insert
  to authenticated
  with check (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "assignments_update_teacher_or_admin" on public.assignments;
create policy "assignments_update_teacher_or_admin"
  on public.assignments for update
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

drop policy if exists "assignments_delete_teacher_or_admin" on public.assignments;
create policy "assignments_delete_teacher_or_admin"
  on public.assignments for delete
  to authenticated
  using (public.is_class_teacher(class_id) or public.is_admin());

-- =========================================================
-- 8) assignment sub-tables (instructions/requirements/resources/rubric/questions)
-- =========================================================
-- Helper predicate reused across sub-tables:
-- public.is_assignment_in_teacher_class(assignment_id)

-- instructions
drop policy if exists "ai_select_teacher_parent_student_admin" on public.assignment_instructions;
create policy "ai_select_teacher_parent_student_admin"
  on public.assignment_instructions for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(assignment_id)
    or exists (
      select 1 from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      where a.id = assignment_id and e.student_id = auth.uid()
    )
    or exists (
      select 1
      from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      join public.guardianships g on g.student_id = e.student_id
      where a.id = assignment_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "ai_insert_teacher_or_admin" on public.assignment_instructions;
create policy "ai_insert_teacher_or_admin"
  on public.assignment_instructions for insert
  to authenticated
  with check (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "ai_update_teacher_or_admin" on public.assignment_instructions;
create policy "ai_update_teacher_or_admin"
  on public.assignment_instructions for update
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "ai_delete_teacher_or_admin" on public.assignment_instructions;
create policy "ai_delete_teacher_or_admin"
  on public.assignment_instructions for delete
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

-- requirements
drop policy if exists "ar_select_teacher_parent_student_admin" on public.assignment_requirements;
create policy "ar_select_teacher_parent_student_admin"
  on public.assignment_requirements for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(assignment_id)
    or exists (
      select 1 from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      where a.id = assignment_id and e.student_id = auth.uid()
    )
    or exists (
      select 1
      from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      join public.guardianships g on g.student_id = e.student_id
      where a.id = assignment_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "ar_insert_teacher_or_admin" on public.assignment_requirements;
create policy "ar_insert_teacher_or_admin"
  on public.assignment_requirements for insert
  to authenticated
  with check (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "ar_update_teacher_or_admin" on public.assignment_requirements;
create policy "ar_update_teacher_or_admin"
  on public.assignment_requirements for update
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "ar_delete_teacher_or_admin" on public.assignment_requirements;
create policy "ar_delete_teacher_or_admin"
  on public.assignment_requirements for delete
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

-- resources
drop policy if exists "ares_select_teacher_parent_student_admin" on public.assignment_resources;
create policy "ares_select_teacher_parent_student_admin"
  on public.assignment_resources for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(assignment_id)
    or exists (
      select 1 from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      where a.id = assignment_id and e.student_id = auth.uid()
    )
    or exists (
      select 1
      from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      join public.guardianships g on g.student_id = e.student_id
      where a.id = assignment_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "ares_insert_teacher_or_admin" on public.assignment_resources;
create policy "ares_insert_teacher_or_admin"
  on public.assignment_resources for insert
  to authenticated
  with check (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "ares_update_teacher_or_admin" on public.assignment_resources;
create policy "ares_update_teacher_or_admin"
  on public.assignment_resources for update
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "ares_delete_teacher_or_admin" on public.assignment_resources;
create policy "ares_delete_teacher_or_admin"
  on public.assignment_resources for delete
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

-- rubric items
drop policy if exists "rubric_select_teacher_parent_student_admin" on public.assignment_rubric_items;
create policy "rubric_select_teacher_parent_student_admin"
  on public.assignment_rubric_items for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(assignment_id)
    or exists (
      select 1 from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      where a.id = assignment_id and e.student_id = auth.uid()
    )
    or exists (
      select 1
      from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      join public.guardianships g on g.student_id = e.student_id
      where a.id = assignment_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "rubric_insert_teacher_or_admin" on public.assignment_rubric_items;
create policy "rubric_insert_teacher_or_admin"
  on public.assignment_rubric_items for insert
  to authenticated
  with check (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "rubric_update_teacher_or_admin" on public.assignment_rubric_items;
create policy "rubric_update_teacher_or_admin"
  on public.assignment_rubric_items for update
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "rubric_delete_teacher_or_admin" on public.assignment_rubric_items;
create policy "rubric_delete_teacher_or_admin"
  on public.assignment_rubric_items for delete
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

-- questions
drop policy if exists "questions_select_teacher_parent_student_admin" on public.assignment_questions;
create policy "questions_select_teacher_parent_student_admin"
  on public.assignment_questions for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(assignment_id)
    or exists (
      select 1 from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      where a.id = assignment_id and e.student_id = auth.uid()
    )
    or exists (
      select 1
      from public.assignments a
      join public.enrollments e on e.class_id = a.class_id
      join public.guardianships g on g.student_id = e.student_id
      where a.id = assignment_id and g.parent_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "questions_insert_teacher_or_admin" on public.assignment_questions;
create policy "questions_insert_teacher_or_admin"
  on public.assignment_questions for insert
  to authenticated
  with check (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "questions_update_teacher_or_admin" on public.assignment_questions;
create policy "questions_update_teacher_or_admin"
  on public.assignment_questions for update
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "questions_delete_teacher_or_admin" on public.assignment_questions;
create policy "questions_delete_teacher_or_admin"
  on public.assignment_questions for delete
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

-- options (need lookup from question -> assignment)
drop policy if exists "options_select_teacher_parent_student_admin" on public.assignment_question_options;
create policy "options_select_teacher_parent_student_admin"
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
      where q.id = question_id and e.student_id = auth.uid()
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

drop policy if exists "options_insert_teacher_or_admin" on public.assignment_question_options;
create policy "options_insert_teacher_or_admin"
  on public.assignment_question_options for insert
  to authenticated
  with check (
    public.is_assignment_in_teacher_class(
      (select q.assignment_id from public.assignment_questions q where q.id = question_id)
    )
    or public.is_admin()
  );

drop policy if exists "options_update_teacher_or_admin" on public.assignment_question_options;
create policy "options_update_teacher_or_admin"
  on public.assignment_question_options for update
  to authenticated
  using (
    public.is_assignment_in_teacher_class(
      (select q.assignment_id from public.assignment_questions q where q.id = question_id)
    )
    or public.is_admin()
  );

drop policy if exists "options_delete_teacher_or_admin" on public.assignment_question_options;
create policy "options_delete_teacher_or_admin"
  on public.assignment_question_options for delete
  to authenticated
  using (
    public.is_assignment_in_teacher_class(
      (select q.assignment_id from public.assignment_questions q where q.id = question_id)
    )
    or public.is_admin()
  );

-- =========================================================
-- 9) assignment_submissions
-- =========================================================
drop policy if exists "submissions_select_own" on public.assignment_submissions;
create policy "submissions_select_own"
  on public.assignment_submissions for select
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "submissions_select_teacher_parent_admin" on public.assignment_submissions;
create policy "submissions_select_teacher_parent_admin"
  on public.assignment_submissions for select
  to authenticated
  using (
    public.is_assignment_in_teacher_class(assignment_id)
    or public.is_submission_of_guardian(id)
    or public.is_admin()
  );

drop policy if exists "submissions_insert_own" on public.assignment_submissions;
create policy "submissions_insert_own"
  on public.assignment_submissions for insert
  to authenticated
  with check (student_id = auth.uid());

drop policy if exists "submissions_update_own" on public.assignment_submissions;
create policy "submissions_update_own"
  on public.assignment_submissions for update
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "submissions_update_teacher_or_admin" on public.assignment_submissions;
create policy "submissions_update_teacher_or_admin"
  on public.assignment_submissions for update
  to authenticated
  using (public.is_assignment_in_teacher_class(assignment_id) or public.is_admin());

drop policy if exists "submissions_delete_admin" on public.assignment_submissions;
create policy "submissions_delete_admin"
  on public.assignment_submissions for delete
  to authenticated
  using (public.is_admin());

-- =========================================================
-- 10) assignment_submission_answers
-- =========================================================
drop policy if exists "submission_answers_select_own" on public.assignment_submission_answers;
create policy "submission_answers_select_own"
  on public.assignment_submission_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
  );

drop policy if exists "submission_answers_select_teacher_parent_admin" on public.assignment_submission_answers;
create policy "submission_answers_select_teacher_parent_admin"
  on public.assignment_submission_answers for select
  to authenticated
  using (
    public.is_submission_in_teacher_class(submission_id)
    or public.is_submission_of_guardian(submission_id)
    or public.is_admin()
  );

drop policy if exists "submission_answers_insert_own" on public.assignment_submission_answers;
create policy "submission_answers_insert_own"
  on public.assignment_submission_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
  );

drop policy if exists "submission_answers_update_own" on public.assignment_submission_answers;
create policy "submission_answers_update_own"
  on public.assignment_submission_answers for update
  to authenticated
  using (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
  );

drop policy if exists "submission_answers_delete_admin" on public.assignment_submission_answers;
create policy "submission_answers_delete_admin"
  on public.assignment_submission_answers for delete
  to authenticated
  using (public.is_admin());

-- =========================================================
-- 11) Link tables (admin-managed)
-- =========================================================
-- profile_roles
drop policy if exists "profile_roles_select_self_or_admin" on public.profile_roles;
create policy "profile_roles_select_self_or_admin"
  on public.profile_roles for select
  to authenticated
  using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "profile_roles_admin_manage" on public.profile_roles;
create policy "profile_roles_admin_manage"
  on public.profile_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- class_teachers
drop policy if exists "class_teachers_select_self_or_admin" on public.class_teachers;
create policy "class_teachers_select_self_or_admin"
  on public.class_teachers for select
  to authenticated
  using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "class_teachers_admin_manage" on public.class_teachers;
create policy "class_teachers_admin_manage"
  on public.class_teachers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- guardianships
drop policy if exists "guardianships_select_parent_or_admin" on public.guardianships;
create policy "guardianships_select_parent_or_admin"
  on public.guardianships for select
  to authenticated
  using (parent_id = auth.uid() or public.is_admin());

drop policy if exists "guardianships_admin_manage" on public.guardianships;
create policy "guardianships_admin_manage"
  on public.guardianships for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================
-- Minimal Auth Setup: auto-profile + default student role
-- =============================================
-- This section is idempotent and safe to run multiple times.

-- 1) Ensure required tables exist
-- Assumes existing public.profiles with (id uuid PK → auth.users.id), name, email, avatar, created_at

-- 2) Helper function: is_admin (optional, used by RLS policies)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((auth.jwt()->>'role') = 'service_role', false)
$$;
grant execute on function public.is_admin() to authenticated;

-- 3) Auto-create profile on auth.users insert (uses raw_user_meta_data)
create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), public.profiles.name),
    avatar = coalesce(nullif(excluded.avatar, ''), public.profiles.avatar);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created_profile on auth.users;
create trigger trg_on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- 4) Default role assignment: create profile_roles and set default 'student' on user creation
-- Table (if you don't already have it)
create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('student','teacher','admin')),
  created_at timestamptz default now(),
  primary key (profile_id, role)
);

-- Trigger function to assign default role
create or replace function public.assign_default_student_role()
returns trigger as $$
begin
  -- Insert default role only if none exists
  if not exists (select 1 from public.profile_roles where profile_id = new.id) then
    insert into public.profile_roles (profile_id, role) values (new.id, 'student');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created_default_role on auth.users;
create trigger trg_on_auth_user_created_default_role
  after insert on auth.users
  for each row execute function public.assign_default_student_role();

-- 5) RLS: enable and set minimal policies
alter table public.profile_roles enable row level security;

-- Drop existing policies with known names if present
drop policy if exists profile_roles_read_self on public.profile_roles;
drop policy if exists profile_roles_manage_admin on public.profile_roles;

-- Allow users to read their own roles
create policy profile_roles_read_self on public.profile_roles
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

-- Allow only admins (or service role via JWT) to manage roles
create policy profile_roles_manage_admin on public.profile_roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6) Optional: RLS for profiles (read own)
alter table public.profiles enable row level security;

drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Note:
-- - Backend NO LONGER needs to insert into profile_roles.
-- - Role defaults to 'student'. Admins can elevate to 'teacher'/'admin' manually.
-- - This avoids RLS violations during signup entirely.
