-- 59_secure_location_battery_checkin_cron.sql
-- Route scheduled jobs to their Supabase Edge Functions and authenticate with
-- distinct Vault-held secrets. No secret values are committed to source.

begin;

do $$
declare
  v_secret_name text;
begin
  foreach v_secret_name in array array[
    'check_geofence_secret',
    'check_battery_secret',
    'check_missed_checkin_secret'
  ] loop
    if not exists (select 1 from vault.secrets where name = v_secret_name) then
      perform vault.create_secret(
        encode(gen_random_bytes(32), 'hex'),
        v_secret_name,
        'Private pg_cron authentication secret for ' || v_secret_name
      );
    end if;
  end loop;
end
$$;

create or replace function public.verify_backend_cron_secret(p_secret_name text, p_candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(p_candidate <> '', false)
     and p_secret_name = any(array[
       'check_geofence_secret',
       'check_battery_secret',
       'check_missed_checkin_secret'
     ])
     and exists (
       select 1
       from vault.decrypted_secrets s
       where s.name = p_secret_name
         and s.decrypted_secret = p_candidate
     );
$function$;

revoke all on function public.verify_backend_cron_secret(text,text) from public, anon, authenticated;
grant execute on function public.verify_backend_cron_secret(text,text) to service_role;

select cron.alter_job(
  (select jobid from cron.job where jobname = 'check-geofence'),
  command := $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/check-geofence',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-job-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'check_geofence_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    ) as request_id;
  $job$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'check-battery'),
  command := $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/check-battery',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-job-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'check_battery_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    ) as request_id;
  $job$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'check-missed-checkin'),
  command := $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/check-missed-checkin',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-job-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'check_missed_checkin_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    ) as request_id;
  $job$
);

commit;
