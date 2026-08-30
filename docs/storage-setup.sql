-- =====================================================================
-- CareerPilot AI — Storage setup (profile photos)
-- Run this once in the Supabase SQL Editor, same as schema.sql.
--
-- Creates the "avatars" bucket and RLS policies on storage.objects so
-- a user can only write inside their own folder (avatars/{user_id}/...)
-- while anyone can read (public profile photos).
--
-- Note: storage.objects already has correct base GRANTs for
-- anon/authenticated/service_role out of the box — that's a Supabase-
-- managed schema, unlike the public schema tables in schema.sql, so
-- the grants fix from that file doesn't apply here.
-- =====================================================================

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
