-- Enforce the app's single-couple scope at the invite boundary.
begin;

create or replace function public.create_couple_code_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  couple_id uuid;
  invite_code text;
begin
  if caller_id is null then
    raise exception 'User not authenticated' using errcode = '42501';
  end if;

  if exists (select 1 from public.couple_links) then
    raise exception 'This private app already has its one couple.';
  end if;

  insert into public.couples (name)
  values (null)
  returning id into couple_id;

  loop
    invite_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.couple_links
      where couple_links.invite_code = invite_code
    );
  end loop;

  insert into public.couple_links (couple_id, inviter_id, accepted_by, invite_code, status)
  values (couple_id, caller_id, null, invite_code, 'pending');

  return invite_code;
end;
$$;

create or replace function public.create_couple_invite(partner_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_name text;
  partner_id uuid;
  couple_id uuid;
  invite_code text;
begin
  if caller_id is null then
    raise exception 'User not authenticated' using errcode = '42501';
  end if;

  if exists (select 1 from public.couple_links) then
    raise exception 'This private app already has its one couple.';
  end if;

  select profile.full_name
  into caller_name
  from public.profiles as profile
  where profile.id = caller_id;

  if not found then
    raise exception 'Authenticated user profile was not found.';
  end if;

  select profile.id
  into partner_id
  from public.profiles as profile
  where lower(profile.email) = lower(btrim(partner_email))
  limit 1;

  if partner_id is null then
    raise exception 'Partner not found. Please ask them to sign up first.';
  end if;

  if partner_id = caller_id then
    raise exception 'You cannot invite yourself.';
  end if;

  insert into public.couples (name)
  values (caller_name)
  returning id into couple_id;

  insert into public.couple_links as created_link (couple_id, inviter_id, accepted_by, status)
  values (couple_id, caller_id, partner_id, 'pending')
  returning created_link.invite_code into invite_code;

  return invite_code;
end;
$$;

revoke execute on function public.create_couple_code_invite() from public, anon;
grant execute on function public.create_couple_code_invite() to authenticated;
revoke execute on function public.create_couple_invite(text) from public, anon;
grant execute on function public.create_couple_invite(text) to authenticated;

commit;