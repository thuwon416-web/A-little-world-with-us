-- 45_offline_sync_and_realtime_backpressure.sql
-- Phase B: idempotent offline message operations + server-side location backpressure.

begin;

alter table public.messages
  add column if not exists sync_version bigint not null default 1;

create index if not exists messages_sync_version_idx
  on public.messages(couple_id, sync_version);

create schema if not exists offline;

create table if not exists offline.applied_ops (
  op_id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null check (operation in ('CREATE','PATCH','DELETE')),
  table_name text not null check (table_name in ('messages')),
  row_id uuid not null,
  result jsonb not null default '{}'::jsonb,
  applied_at timestamptz not null default now()
);

create index if not exists applied_ops_user_applied_idx
  on offline.applied_ops(user_id, applied_at desc);

alter table offline.applied_ops enable row level security;
revoke all on table offline.applied_ops from public, anon, authenticated;

create or replace function offline.apply_op(
  p_op_id uuid, p_operation text, p_table_name text, p_row_id uuid,
  p_base_version bigint, p_payload jsonb
)
returns table(applied boolean, conflict boolean, current_version bigint, row_data jsonb)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing jsonb;
  v_version bigint;
  v_row public.messages%rowtype;
  v_couple_id uuid;
begin
  if v_user_id is null then raise exception 'not authenticated'; end if;
  if p_table_name <> 'messages' then raise exception 'unsupported sync table'; end if;

  select a.result into v_existing from offline.applied_ops a
   where a.op_id = p_op_id for share;
  if v_existing is not null then
    return query select true,
      coalesce((v_existing->>'conflict')::boolean,false),
      coalesce((v_existing->>'current_version')::bigint,0),
      coalesce(v_existing->'row_data','{}'::jsonb);
    return;
  end if;

  if p_operation = 'CREATE' then
    if p_base_version is distinct from 0 then raise exception 'create requires base_version 0'; end if;
    v_couple_id := (p_payload->>'couple_id')::uuid;
    if (p_payload->>'sender_id')::uuid <> v_user_id then raise exception 'sender mismatch'; end if;
    if not exists (
      select 1 from public.couple_links cl
       where cl.couple_id=v_couple_id and cl.status='accepted'
         and (cl.inviter_id=v_user_id or cl.accepted_by=v_user_id)
    ) then raise exception 'not a member of couple'; end if;

    insert into public.messages (
      id,couple_id,sender_id,content,message_type,media_url,media_duration,
      transcript,location_payload,encrypted,encryption_version,edited_at,deleted_at,
      created_at,sync_version
    ) values (
      p_row_id,v_couple_id,v_user_id,nullif(p_payload->>'content',''),
      coalesce(nullif(p_payload->>'message_type',''),'text'),
      nullif(p_payload->>'media_url',''),
      nullif(p_payload->>'media_duration','')::integer,
      nullif(p_payload->>'transcript',''),
      case when p_payload ? 'location_payload' then p_payload->'location_payload' else null end,
      coalesce((p_payload->>'encrypted')::boolean,false),
      nullif(p_payload->>'encryption_version','')::integer,
      nullif(p_payload->>'edited_at','')::timestamptz,
      nullif(p_payload->>'deleted_at','')::timestamptz,
      coalesce(nullif(p_payload->>'created_at','')::timestamptz,now()),1
    ) on conflict (id) do nothing;

    select m.* into v_row from public.messages m where m.id=p_row_id;
    if not found then raise exception 'message create conflict'; end if;

  elsif p_operation in ('PATCH','DELETE') then
    select m.* into v_row from public.messages m where m.id=p_row_id for update;
    if not found then raise exception 'message not found'; end if;
    if v_row.sender_id <> v_user_id then raise exception 'only sender may modify message'; end if;

    v_version := coalesce(v_row.sync_version,1);
    if v_version <> p_base_version then
      v_existing := jsonb_build_object('conflict',true,'current_version',v_version,'row_data',to_jsonb(v_row));
      insert into offline.applied_ops values(p_op_id,v_user_id,p_operation,p_table_name,p_row_id,v_existing,now())
        on conflict (op_id) do nothing;
      return query select false,true,v_version,to_jsonb(v_row);
      return;
    end if;

    if p_operation='DELETE' then
      update public.messages set deleted_at=now(),sync_version=v_version+1
       where id=p_row_id returning * into v_row;
    else
      update public.messages set
        content=case when p_payload ? 'content' then p_payload->>'content' else content end,
        media_url=case when p_payload ? 'media_url' then nullif(p_payload->>'media_url','') else media_url end,
        media_duration=case when p_payload ? 'media_duration' then nullif(p_payload->>'media_duration','')::integer else media_duration end,
        transcript=case when p_payload ? 'transcript' then nullif(p_payload->>'transcript','') else transcript end,
        location_payload=case when p_payload ? 'location_payload' then p_payload->'location_payload' else location_payload end,
        edited_at=case when p_payload ? 'edited_at' then nullif(p_payload->>'edited_at','')::timestamptz else edited_at end,
        encryption_version=case when p_payload ? 'encryption_version' then nullif(p_payload->>'encryption_version','')::integer else encryption_version end,
        encrypted=case when p_payload ? 'encrypted' then (p_payload->>'encrypted')::boolean else encrypted end,
        sync_version=v_version+1
       where id=p_row_id returning * into v_row;
    end if;
  else
    raise exception 'unsupported sync operation';
  end if;

  v_existing := jsonb_build_object('conflict',false,'current_version',coalesce(v_row.sync_version,1),'row_data',to_jsonb(v_row));
  insert into offline.applied_ops values(p_op_id,v_user_id,p_operation,p_table_name,p_row_id,v_existing,now())
    on conflict (op_id) do nothing;
  return query select true,false,coalesce(v_row.sync_version,1),to_jsonb(v_row);
end;
$$;

create or replace function public.apply_offline_op(
  p_op_id uuid, p_operation text, p_table_name text, p_row_id uuid,
  p_base_version bigint, p_payload jsonb
)
returns table(applied boolean, conflict boolean, current_version bigint, row_data jsonb)
language sql security definer set search_path = ''
as $$
  select * from offline.apply_op(p_op_id,p_operation,p_table_name,p_row_id,p_base_version,p_payload);
$$;

revoke all on function public.apply_offline_op(uuid,text,text,uuid,bigint,jsonb) from public,anon;
grant execute on function public.apply_offline_op(uuid,text,text,uuid,bigint,jsonb) to authenticated;

-- Keep the security-definer entrypoint restricted to authenticated callers only.
revoke all on function offline.apply_op(uuid,text,text,uuid,bigint,jsonb) from public,anon,authenticated;

create or replace function public.record_location_point(
  p_couple_id uuid,p_latitude double precision,p_longitude double precision,
  p_accuracy double precision,p_updated_at timestamptz,p_status jsonb default '{}'::jsonb
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_user_id uuid:=auth.uid(); v_last timestamptz;
begin
  if v_user_id is null then raise exception 'not authenticated'; end if;
  if not exists (
    select 1 from public.couple_links cl where cl.couple_id=p_couple_id and cl.status='accepted'
      and (cl.inviter_id=v_user_id or cl.accepted_by=v_user_id)
  ) then raise exception 'not a member of couple'; end if;
  if not exists (select 1 from public.location_sharing_settings s where s.user_id=v_user_id and s.enabled) then return false; end if;

  select max(lh.captured_at) into v_last from public.location_history lh
   where lh.user_id=v_user_id and lh.couple_id=p_couple_id;
  if v_last is not null and p_updated_at < v_last then return false; end if;
  if v_last is not null and v_last > now()-interval '10 seconds' then return false; end if;

  insert into public.user_locations (
    user_id,couple_id,latitude,longitude,accuracy,updated_at,battery_level,is_charging,
    network_type,device_name,app_version,last_sync_at
  ) values (
    v_user_id,p_couple_id,p_latitude,p_longitude,coalesce(p_accuracy,0),p_updated_at,
    nullif(p_status->>'battery_level','')::integer,
    nullif(p_status->>'is_charging','')::boolean,
    nullif(p_status->>'network_type',''),nullif(p_status->>'device_name',''),
    nullif(p_status->>'app_version',''),
    coalesce(nullif(p_status->>'last_sync_at','')::timestamptz,now())
  ) on conflict(user_id) do update set
    couple_id=excluded.couple_id,latitude=excluded.latitude,longitude=excluded.longitude,
    accuracy=excluded.accuracy,updated_at=excluded.updated_at,battery_level=excluded.battery_level,
    is_charging=excluded.is_charging,network_type=excluded.network_type,
    device_name=excluded.device_name,app_version=excluded.app_version,last_sync_at=excluded.last_sync_at;

  insert into public.location_history(user_id,couple_id,latitude,longitude,accuracy,captured_at)
  values(v_user_id,p_couple_id,p_latitude,p_longitude,p_accuracy,p_updated_at);
  return true;
end;
$$;

revoke all on function public.record_location_point(uuid,double precision,double precision,double precision,timestamptz,jsonb) from public,anon;
grant execute on function public.record_location_point(uuid,double precision,double precision,double precision,timestamptz,jsonb) to authenticated;

commit;
