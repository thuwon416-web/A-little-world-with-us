-- ----------------------------------------------------------------
-- 12_admin_roles.sql - Migration to add role-based admin checks
-- ----------------------------------------------------------------
-- This migration replaces hardcoded email checks with role-based
-- authentication. After this migration, admin status is determined
-- by the `role` column in the profiles table, not email addresses.
-- ----------------------------------------------------------------

-- Add role column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles add column role text not null default 'user';
  end if;
end $$;

-- Add check constraint for role values (idempotent)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles 
  add constraint profiles_role_check 
  check (role in ('user', 'admin'));

-- Update existing admin user to have admin role
-- Uses PostgreSQL setting, set via ALTER DATABASE
update public.profiles 
set role = 'admin' 
where id = (
  select id from auth.users 
  where email = current_setting('app.admin_seed_email', true)
);

-- Create is_admin() function that checks role instead of email
create or replace function public.is_admin() returns boolean 
language sql 
stable 
security definer 
set search_path = public 
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Update is_location_admin() to use is_admin()
-- NOTE: This function is also created in 00_core.sql
-- Keep both in sync when changing admin logic.
create or replace function public.is_location_admin() returns boolean 
language sql 
stable 
security definer 
set search_path = public 
as $$
  select public.is_admin();
$$;

-- Add index on role for performance
create index if not exists idx_profiles_role on public.profiles(role);

-- Grant execute permission on is_admin() (only for authenticated users)
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_location_admin() to authenticated;
