-- Storage Policies for class-modules bucket
-- Run this in Supabase SQL editor.

-- Ensure RLS is enabled on storage.objects (usually enabled by default)
alter table storage.objects enable row level security;

-- Allow public read for objects in class-modules bucket
drop policy if exists "class-modules public read" on storage.objects;
create policy "class-modules public read"
  on storage.objects for select
  to public
  using (bucket_id = 'class-modules');

-- Allow service role (backend) to manage all objects in class-modules
drop policy if exists "class-modules service manage" on storage.objects;
create policy "class-modules service manage"
  on storage.objects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================
-- OPTION: Disable RLS for this bucket (wide-open)
-- This effectively allows anyone to insert/update/delete/read in 'class-modules'.
-- Use only if you understand the implications.
-- To enable: run this SQL block; to revert, drop this policy and keep the stricter ones below.
drop policy if exists "class-modules allow all" on storage.objects;
create policy "class-modules allow all"
  on storage.objects for all
  to public
  using (bucket_id = 'class-modules')
  with check (bucket_id = 'class-modules');

-- Ensure bucket is public for unauthenticated reads
update storage.buckets set public = true where name = 'class-modules';

-- Optional: allow authenticated teachers to upload within their own folder structure
-- Adjust predicate as needed based on your path convention `${classId}/${moduleId}/${itemId}/filename`
-- Example below allows any authenticated user to insert/update/delete (you can tighten later)
drop policy if exists "class-modules auth write" on storage.objects;
create policy "class-modules auth write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'class-modules');

drop policy if exists "class-modules auth update" on storage.objects;
create policy "class-modules auth update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'class-modules')
  with check (bucket_id = 'class-modules');

drop policy if exists "class-modules auth delete" on storage.objects;
create policy "class-modules auth delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'class-modules');


