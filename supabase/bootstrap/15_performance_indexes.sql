-- Performance indexes (Week 3 PERF-009)

-- messages
create index if not exists messages_sender_idx 
  on public.messages(sender_id);
create index if not exists messages_couple_sender_created_idx 
  on public.messages(couple_id, sender_id, created_at desc);

-- location_history
create index if not exists location_history_user_idx 
  on public.location_history(user_id);
create index if not exists location_history_user_captured_idx 
  on public.location_history(user_id, captured_at desc);

-- wellness_entries
create index if not exists wellness_entries_couple_created_idx 
  on public.wellness_entries(couple_id, created_at desc);

-- finance_expenses
create index if not exists finance_expenses_couple_created_idx 
  on public.finance_expenses(couple_id, created_at desc);

-- memories
create index if not exists memories_user_idx 
  on public.memories(user_id);

-- emergency_alerts
create index if not exists emergency_alerts_couple_resolved_idx 
  on public.emergency_alerts(couple_id, resolved_at);

-- safety_checkins
create index if not exists safety_checkins_user_created_idx 
  on public.safety_checkins(user_id, created_at desc);

-- geofence_events
create index if not exists geofence_events_place_idx 
  on public.geofence_events(saved_place_id);

-- call_signals
create index if not exists call_signals_caller_created_idx 
  on public.call_signals(caller_id, created_at desc);
