begin;

-- Create a dedicated random secret for the surprise-reveal scheduled job.
-- Never print or return the generated value from this migration.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'surprise_reveal_secret') then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'surprise_reveal_secret',
      'Private authentication secret for the reveal-surprises pg_cron job'
    );
  end if;
end
$$;

-- The Edge Function calls this RPC with its service-role client. Only
-- service_role can execute it; callers learn only whether a candidate matches.
create or replace function public.verify_surprise_reveal_job_secret(p_candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(p_candidate <> '', false)
     and exists (
       select 1
       from vault.decrypted_secrets s
       where s.name = 'surprise_reveal_secret'
         and s.decrypted_secret = p_candidate
     );
$function$;

revoke all on function public.verify_surprise_reveal_job_secret(text) from public, anon, authenticated;
grant execute on function public.verify_surprise_reveal_job_secret(text) to service_role;

-- Repair the existing schedule without invoking it here. The next scheduled
-- run will process only capsules whose unlock_at has passed and send expected
-- notifications for those capsules.
do $$
declare
  v_count integer;
begin
  update cron.job
  set command = $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/reveal-surprises',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-job-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'surprise_reveal_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 5000
    ) as request_id;
  $job$
  where jobname = 'reveal-surprises';
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'Expected exactly one reveal-surprises cron job; updated %', v_count;
  end if;
end
$$;

commit;