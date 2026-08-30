-- =====================================================================
-- CareerPilot AI — Storage setup (profile photos, resumes)
-- Run this once in the Supabase SQL Editor, same as schema.sql.
-- Safe to re-run: bucket upserts and `create policy` guard nothing, so
-- if you're re-running after the "avatars" section already succeeded,
-- skip straight to the "resumes" section below.
--
-- Note: storage.objects already has correct base GRANTs for
-- anon/authenticated/service_role out of the box — that's a Supabase-
-- managed schema, unlike the public schema tables in schema.sql, so
-- the grants fix from that file doesn't apply here.
-- =====================================================================

-- ---------------------------------------------------------------------
-- avatars — public bucket (profile photos are low-sensitivity and meant
-- to be widely viewable), one file per user at avatars/{user_id}/avatar.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------------
-- resumes — PRIVATE bucket (resumes carry real PII: phone, full work
-- history, sometimes address). Unlike avatars, there is no public-read
-- policy — only the owner can select/insert/update/delete their own
-- files, matching (storage.foldername(name))[1] = auth.uid()::text.
-- The app reads files via short-lived signed URLs generated on demand
-- (see resume-list-item.tsx / resume-preview-panel.tsx), never a
-- permanent public URL — resumes.file_url stores the storage PATH
-- (e.g. "{user_id}/{resume_id}.pdf"), not a URL, despite the column name.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880, -- 5MB
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "resumes_owner_select" on storage.objects
  for select using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resumes_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resumes_owner_update" on storage.objects
  for update using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resumes_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );
