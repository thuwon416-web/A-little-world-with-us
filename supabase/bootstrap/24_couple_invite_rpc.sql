alter table public.couple_links
  add column if not exists expires_at timestamptz not null default (now() + interval '15 minutes');

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

  if exists (
    select 1
    from public.couple_links
    where status = 'accepted'
      and caller_id in (inviter_id, accepted_by)
  ) then
    raise exception 'You are already in a couple.';
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

  if exists (
    select 1
    from public.couple_links
    where status = 'accepted'
      and partner_id in (inviter_id, accepted_by)
  ) then
    raise exception 'Partner is already in a couple.';
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

revoke execute on function public.create_couple_invite(text) from public, anon;
grant execute on function public.create_couple_invite(text) to authenticated;

create or replace function public.accept_couple_invite(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  couple_id uuid;
begin
  if caller_id is null then
    raise exception 'User not authenticated' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.couple_links
    where status = 'accepted'
      and caller_id in (inviter_id, accepted_by)
  ) then
    raise exception 'You are already in a couple.';
  end if;

  update public.couple_links as target_link
  set accepted_by = caller_id,
      status = 'accepted',
      accepted_at = now()
  where target_link.invite_code = p_invite_code
    and target_link.status = 'pending'
    and target_link.expires_at > now()
    and target_link.accepted_by = caller_id
    and target_link.inviter_id <> caller_id
  returning target_link.couple_id into couple_id;

  if not found then
    raise exception 'Invite is invalid, expired, or not addressed to this user.';
  end if;

  return couple_id;
end;
$$;

revoke execute on function public.accept_couple_invite(text) from public, anon;
grant execute on function public.accept_couple_invite(text) to authenticated;

create or replace function public.decline_couple_invite(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'User not authenticated' using errcode = '42501';
  end if;

  update public.couple_links as target_link
  set status = 'declined'
  where target_link.id = p_link_id
    and target_link.accepted_by = caller_id
    and target_link.status = 'pending'
    and target_link.expires_at > now();

  if not found then
    raise exception 'Invite is invalid, expired, or not addressed to this user.';
  end if;
end;
$$;

revoke execute on function public.decline_couple_invite(uuid) from public, anon;
grant execute on function public.decline_couple_invite(uuid) to authenticated;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  link_id uuid;
begin
  if caller_id is null then
    raise exception 'User not authenticated' using errcode = '42501';
  end if;

  select link.id
  into link_id
  from public.couple_links as link
  where link.status = 'accepted'
    and caller_id in (link.inviter_id, link.accepted_by)
  order by link.accepted_at desc nulls last
  limit 1
  for update;

  if link_id is null then
    raise exception 'No active couple found.';
  end if;

  update public.couple_links
  set status = 'revoked',
      accepted_at = null
  where id = link_id;
end;
$$;

revoke execute on function public.leave_couple() from public, anon;
grant execute on function public.leave_couple() to authenticated;
