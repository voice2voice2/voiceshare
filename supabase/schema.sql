-- Run this in Supabase Dashboard > SQL Editor > New query.
-- The uploads bucket must remain PRIVATE.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text not null unique,
  file_type text not null,
  file_size bigint not null check (file_size > 0),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.uploads enable row level security;

-- Admins can confirm their own admin membership.
drop policy if exists "Admins can read own admin row" on public.admin_users;
create policy "Admins can read own admin row"
on public.admin_users for select to authenticated
using (auth.uid() = user_id);

-- Only admins can read upload metadata through the public/anon Supabase API.
drop policy if exists "Admins can read uploads" on public.uploads;
create policy "Admins can read uploads"
on public.uploads for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- No public policies are created for inserting, updating, or deleting records.
-- Server API uses the service-role key for controlled inserts.

-- Private storage read policy: only registered admins can download/list objects.
drop policy if exists "Admins can read private upload objects" on storage.objects;
create policy "Admins can read private upload objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'uploads'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

-- No public read policy and no anonymous upload policy are created.
