begin;

do $$
begin
  if to_regclass('public.relationship_memories') is not null then
    drop policy if exists relationship_memories_couple_access on public.relationship_memories;
  end if;
end
$$;
drop index if exists public.relationship_memories_couple_date_idx;
drop index if exists public.relationship_memories_couple_category_idx;
drop index if exists public.relationship_memories_couple_importance_idx;
drop table if exists public.relationship_memories;

commit;
