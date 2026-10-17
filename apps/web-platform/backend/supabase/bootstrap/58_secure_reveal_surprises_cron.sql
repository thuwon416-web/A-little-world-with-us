-- 58_secure_reveal_surprises_cron.sql
-- Keep the scheduled surprise-reveal job authenticated without a hardcoded
-- credential in cron.job.command. The secret itself is generated in Vault.

begin;

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

select cron.alter_job(
  (select jobid from cron.job where jobname = 'reveal-surprises'),
  command := $job$
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
);

commit;
