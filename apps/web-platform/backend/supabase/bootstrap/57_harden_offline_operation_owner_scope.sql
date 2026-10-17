-- Harden offline operation idempotency so one authenticated user cannot
-- replay another user's operation UUID and receive their cached message row.
-- Also reject message-ID collisions that resolve to another sender/couple.

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
  v_existing_user_id uuid;
  v_existing_operation text;
  v_existing_table_name text;
  v_existing_row_id uuid;
  v_version bigint;
  v_row public.messages%rowtype;
  v_couple_id uuid;
begin
  if v_user_id is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_table_name is distinct from 'messages' then raise exception 'unsupported sync table'; end if;

  select a.user_id, a.operation, a.table_name, a.row_id, a.result
    into v_existing_user_id, v_existing_operation, v_existing_table_name, v_existing_row_id, v_existing
  from offline.applied_ops a
  where a.op_id = p_op_id
  for share;

  if v_existing_user_id is not null then
    if v_existing_user_id <> v_user_id then
      raise exception 'operation id already used' using errcode = '23505';
    end if;
    if v_existing_operation is distinct from p_operation
       or v_existing_table_name is distinct from p_table_name
       or v_existing_row_id is distinct from p_row_id then
      raise exception 'operation id reused for a different operation' using errcode = '23505';
    end if;
    return query select true,
      coalesce((v_existing->>'conflict')::boolean,false),
      coalesce((v_existing->>'current_version')::bigint,0),
      coalesce(v_existing->'row_data','{}'::jsonb);
    return;
  end if;

  if p_operation = 'CREATE' then
    if p_base_version is distinct from 0 then raise exception 'create requires base_version 0'; end if;
    v_couple_id := (p_payload->>'couple_id')::uuid;
    if (p_payload->>'sender_id')::uuid is distinct from v_user_id then raise exception 'sender mismatch'; end if;
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
    if v_row.sender_id <> v_user_id or v_row.couple_id <> v_couple_id then
      raise exception 'message create conflict';
    end if;

  elsif p_operation in ('PATCH','DELETE') then
    select m.* into v_row from public.messages m where m.id=p_row_id for update;
    if not found then raise exception 'message not found'; end if;
    if v_row.sender_id <> v_user_id then raise exception 'only sender may modify message'; end if;

    v_version := coalesce(v_row.sync_version,1);
    if v_version <> p_base_version then
      v_existing := jsonb_build_object('conflict',true,'current_version',v_version,'row_data',to_jsonb(v_row));
      insert into offline.applied_ops (op_id,user_id,operation,table_name,row_id,result,applied_at)
      values(p_op_id,v_user_id,p_operation,p_table_name,p_row_id,v_existing,now())
      on conflict (op_id) do nothing;
      if not found then raise exception 'operation id already used' using errcode = '23505'; end if;
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
  insert into offline.applied_ops (op_id,user_id,operation,table_name,row_id,result,applied_at)
  values(p_op_id,v_user_id,p_operation,p_table_name,p_row_id,v_existing,now())
  on conflict (op_id) do nothing;
  if not found then raise exception 'operation id already used' using errcode = '23505'; end if;

  return query select true,false,coalesce(v_row.sync_version,1),to_jsonb(v_row);
end;
$$;
