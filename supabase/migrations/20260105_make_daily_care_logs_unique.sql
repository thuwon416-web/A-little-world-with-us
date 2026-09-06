-- One daily care record per account and date. Existing deployments should apply this
-- before using the mobile Care screen's update-or-create workflow.
create unique index if not exists care_daily_logs_user_date_unique
  on public.care_daily_logs(user_id, log_date);
