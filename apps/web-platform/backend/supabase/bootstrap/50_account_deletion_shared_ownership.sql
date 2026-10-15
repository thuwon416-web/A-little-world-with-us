-- 50_account_deletion_shared_ownership.sql
-- Account deletion semantics:
--   * account deletion does not delete the couple relationship
--   * couple-owned content survives
--   * user references used only as provenance become nullable/SET NULL
--   * private/user-owned rows may continue using CASCADE
--
-- This is a forward-only bootstrap/migration record. Apply after staging verification.

begin;

alter table public.couple_links
  alter column inviter_id drop not null,
  alter column accepted_by drop not null;

alter table public.couple_links
  drop constraint if exists couple_links_inviter_id_fkey,
  drop constraint if exists couple_links_accepted_by_fkey;

alter table public.couple_links
  add constraint couple_links_inviter_id_fkey
    foreign key (inviter_id) references public.profiles(id) on delete set null,
  add constraint couple_links_accepted_by_fkey
    foreign key (accepted_by) references public.profiles(id) on delete set null;

alter table public.memories alter column user_id drop not null;
alter table public.messages alter column sender_id drop not null;
alter table public.calendar_events alter column user_id drop not null;
alter table public.financial_goals alter column user_id drop not null;
alter table public.finance_expenses alter column user_id drop not null;
alter table public.reminders alter column user_id drop not null;
alter table public.goals alter column user_id drop not null;
alter table public.todos alter column user_id drop not null;
alter table public.care_daily_logs alter column user_id drop not null;
alter table public.care_logs alter column user_id drop not null;
alter table public.care_reminders alter column user_id drop not null;
alter table public.shared_playlist alter column added_by drop not null;
alter table public.watchlist alter column added_by drop not null;
alter table public.watch_history alter column watched_by drop not null;
alter table public.wellness_entries alter column author_id drop not null;
alter table public.time_capsules alter column user_id drop not null;
alter table public.time_capsules alter column recipient_id drop not null;
alter table public.vault_items alter column user_id drop not null;
alter table public.vault_credentials alter column user_id drop not null;
alter table public.saved_places alter column created_by drop not null;
alter table public.emergency_contacts alter column created_by drop not null;
alter table public.export_jobs alter column requested_by drop not null;
alter table public.monthly_budgets alter column user_id drop not null;
alter table public.bill_reminders alter column user_id drop not null;
alter table public.settlements alter column from_user drop not null;
alter table public.settlements alter column to_user drop not null;

alter table public.memories drop constraint if exists memories_user_id_fkey;
alter table public.messages drop constraint if exists messages_sender_id_fkey;
alter table public.calendar_events drop constraint if exists calendar_events_user_id_fkey;
alter table public.financial_goals drop constraint if exists financial_goals_user_id_fkey;
alter table public.finance_expenses drop constraint if exists finance_expenses_user_id_fkey;
alter table public.reminders drop constraint if exists reminders_user_id_fkey;
alter table public.goals drop constraint if exists goals_user_id_fkey;
alter table public.todos drop constraint if exists todos_user_id_fkey;
alter table public.care_daily_logs drop constraint if exists care_daily_logs_user_id_fkey;
alter table public.care_logs drop constraint if exists care_logs_user_id_fkey;
alter table public.care_reminders drop constraint if exists care_reminders_user_id_fkey;
alter table public.shared_playlist drop constraint if exists shared_playlist_added_by_fkey;
alter table public.watchlist drop constraint if exists watchlist_added_by_fkey;
alter table public.watch_history drop constraint if exists watch_history_watched_by_fkey;
alter table public.wellness_entries drop constraint if exists wellness_entries_author_id_fkey;
alter table public.time_capsules drop constraint if exists time_capsules_user_id_fkey;
alter table public.time_capsules drop constraint if exists time_capsules_recipient_id_fkey;
alter table public.vault_items drop constraint if exists vault_items_user_id_fkey;
alter table public.vault_credentials drop constraint if exists vault_credentials_user_id_fkey;
alter table public.saved_places drop constraint if exists saved_places_created_by_fkey;
alter table public.emergency_contacts drop constraint if exists emergency_contacts_created_by_fkey;
alter table public.export_jobs drop constraint if exists export_jobs_requested_by_fkey;
alter table public.monthly_budgets drop constraint if exists monthly_budgets_user_id_fkey;
alter table public.bill_reminders drop constraint if exists bill_reminders_user_id_fkey;
alter table public.settlements drop constraint if exists settlements_from_user_fkey;
alter table public.settlements drop constraint if exists settlements_to_user_fkey;

alter table public.memories add constraint memories_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.messages add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;
alter table public.calendar_events add constraint calendar_events_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.financial_goals add constraint financial_goals_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.finance_expenses add constraint finance_expenses_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.reminders add constraint reminders_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.goals add constraint goals_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.todos add constraint todos_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.care_daily_logs add constraint care_daily_logs_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.care_logs add constraint care_logs_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.care_reminders add constraint care_reminders_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.shared_playlist add constraint shared_playlist_added_by_fkey foreign key (added_by) references public.profiles(id) on delete set null;
alter table public.watchlist add constraint watchlist_added_by_fkey foreign key (added_by) references public.profiles(id) on delete set null;
alter table public.watch_history add constraint watch_history_watched_by_fkey foreign key (watched_by) references public.profiles(id) on delete set null;
alter table public.wellness_entries add constraint wellness_entries_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.time_capsules add constraint time_capsules_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.time_capsules add constraint time_capsules_recipient_id_fkey foreign key (recipient_id) references public.profiles(id) on delete set null;
alter table public.vault_items add constraint vault_items_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.vault_credentials add constraint vault_credentials_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.saved_places add constraint saved_places_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
alter table public.emergency_contacts add constraint emergency_contacts_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
alter table public.export_jobs add constraint export_jobs_requested_by_fkey foreign key (requested_by) references public.profiles(id) on delete set null;
alter table public.monthly_budgets add constraint monthly_budgets_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.bill_reminders add constraint bill_reminders_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
alter table public.settlements add constraint settlements_from_user_fkey foreign key (from_user) references public.profiles(id) on delete set null;
alter table public.settlements add constraint settlements_to_user_fkey foreign key (to_user) references public.profiles(id) on delete set null;

create or replace function public.is_couple_member(target_couple_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.couple_links cl
    where cl.couple_id = target_couple_id
      and cl.status = 'accepted'
      and auth.uid() in (cl.inviter_id, cl.accepted_by)
  );
$function$;

create or replace function public.has_accepted_couple()
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.couple_links cl
    where cl.status = 'accepted'
      and auth.uid() in (cl.inviter_id, cl.accepted_by)
  );
$function$;

create or replace function public.is_linked_user(target_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select auth.uid() = target_user_id
    or exists (
      select 1 from public.couple_links cl
      where cl.status = 'accepted'
        and (
          (cl.inviter_id = auth.uid() and cl.accepted_by = target_user_id)
          or (cl.accepted_by = auth.uid() and cl.inviter_id = target_user_id)
        )
    );
$function$;

commit;
