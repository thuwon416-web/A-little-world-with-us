-- Increase newly generated couple-code invites from 32 to 64 bits of entropy.
-- Existing invite codes remain valid until their original expiration.
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
    invite_code := upper(encode(gen_random_bytes(8), 'hex'));
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

revoke all on function public.create_couple_code_invite() from public, anon;
grant execute on function public.create_couple_code_invite() to authenticated;
