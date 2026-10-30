-- Validate location RPC input and serialize per-user writes to enforce backpressure.
create or replace function public.record_location_point(
  p_couple_id uuid,p_latitude double precision,p_longitude double precision,
  p_accuracy double precision,p_updated_at timestamptz,p_status jsonb default '{}'::jsonb
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_last timestamptz;
  v_status jsonb := coalesce(p_status, '{}'::jsonb);
  v_battery_text text;
  v_charging_text text;
  v_battery_level integer;
  v_sharing_enabled boolean;
  v_network_type text;
  v_device_name text;
  v_app_version text;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_couple_id is null
    or p_latitude is null or p_latitude < -90 or p_latitude > 90
    or p_longitude is null or p_longitude < -180 or p_longitude > 180
    or (p_accuracy is not null and (p_accuracy < 0 or p_accuracy > 100000))
    or p_updated_at is null
    or p_updated_at > now() + interval '5 minutes' then
    raise exception 'invalid location point';
  end if;

  if jsonb_typeof(v_status) <> 'object' then
    raise exception 'invalid device status';
  end if;

  v_battery_text := nullif(v_status->>'battery_level', '');
  if v_battery_text is not null then
    if v_battery_text !~ '^[0-9]{1,3}$' then
      raise exception 'invalid battery level';
    end if;
    v_battery_level := v_battery_text::integer;
    if v_battery_level > 100 then
      raise exception 'invalid battery level';
    end if;
  end if;

  v_charging_text := lower(nullif(v_status->>'is_charging', ''));
  if v_charging_text is not null and v_charging_text not in ('true', 'false') then
    raise exception 'invalid charging status';
  end if;

  v_network_type := nullif(v_status->>'network_type', '');
  v_device_name := nullif(v_status->>'device_name', '');
  v_app_version := nullif(v_status->>'app_version', '');
  if length(v_network_type) > 32 or length(v_device_name) > 128 or length(v_app_version) > 64 then
    raise exception 'device status field is too long';
  end if;

  if not exists (
    select 1 from public.couple_links cl
    where cl.couple_id = p_couple_id and cl.status = 'accepted'
      and (cl.inviter_id = v_user_id or cl.accepted_by = v_user_id)
  ) then
    raise exception 'not a member of couple' using errcode = '42501';
  end if;

  select s.enabled into v_sharing_enabled
  from public.location_sharing_settings s
  where s.user_id = v_user_id
  for share;
  if not coalesce(v_sharing_enabled, false) then
    return false;
  end if;

  -- Serialize updates for this user so concurrent requests cannot bypass
  -- the server-side 10-second location backpressure window.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  select max(lh.captured_at) into v_last
  from public.location_history lh
  where lh.user_id = v_user_id and lh.couple_id = p_couple_id;

  if v_last is not null and p_updated_at < v_last then
    return false;
  end if;
  if v_last is not null and v_last > now() - interval '10 seconds' then
    return false;
  end if;

  insert into public.user_locations (
    user_id,couple_id,latitude,longitude,accuracy,updated_at,battery_level,is_charging,
    network_type,device_name,app_version,last_sync_at
  ) values (
    v_user_id,p_couple_id,p_latitude,p_longitude,coalesce(p_accuracy,0),p_updated_at,
    v_battery_level,
    case when v_charging_text is null then null else v_charging_text::boolean end,
    v_network_type,v_device_name,v_app_version,now()
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
