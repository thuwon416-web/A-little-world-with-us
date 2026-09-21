-- Performance Optimization RPC Functions
-- Created for PERF-003 and PERF-004

-- On This Day query
-- Returns memories from the same month/day across all years
create or replace function public.on_this_day_memories(
  p_couple_id uuid,
  p_month integer,
  p_day integer
)
returns setof public.relationship_memories
language sql
stable
security invoker
as $$
  select * from public.relationship_memories
  where couple_id = p_couple_id
    and extract(month from date_time) = p_month
    and extract(day from date_time) = p_day
  order by date_time desc;
$$;

-- Category stats aggregation
-- Returns count of memories per category
create or replace function public.memory_category_stats(
  p_couple_id uuid
)
returns table(category text, count bigint)
language sql
stable
security invoker
as $$
  select category, count(*)::bigint
  from public.relationship_memories
  where couple_id = p_couple_id
  group by category;
$$;
