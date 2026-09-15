-- Phase 12.2c: Korean learning content, quizzes, and progress
begin;

create table if not exists public.korean_lessons (
  id uuid primary key default gen_random_uuid(),
  level smallint not null check (level between 1 and 7),
  title text not null,
  title_my text not null,
  description text not null,
  lesson_order integer not null check (lesson_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (level, lesson_order)
);

create table if not exists public.korean_vocab (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.korean_lessons(id) on delete cascade,
  level smallint not null check (level between 1 and 7),
  korean text not null,
  romanization text not null,
  english text not null,
  myanmar text not null,
  audio_url text,
  example_sentence text,
  example_translation text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.korean_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  target_user uuid not null references public.profiles(id) on delete cascade,
  level smallint not null check (level between 1 and 7),
  quiz_type text not null check (quiz_type in ('multiple_choice', 'fill_blank', 'matching', 'listening', 'typing')),
  focus_categories text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  score integer check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.korean_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.korean_quiz_sessions(id) on delete cascade,
  vocab_id uuid not null references public.korean_vocab(id) on delete cascade,
  question_type text not null check (question_type in ('multiple_choice', 'fill_blank', 'matching', 'listening', 'typing')),
  question_text text not null,
  options text[],
  correct_answer text not null,
  user_answer text,
  is_correct boolean,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.korean_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vocab_id uuid not null references public.korean_vocab(id) on delete cascade,
  mastery_level smallint not null default 0 check (mastery_level between 0 and 5),
  times_correct integer not null default 0 check (times_correct >= 0),
  times_wrong integer not null default 0 check (times_wrong >= 0),
  last_reviewed_at timestamptz not null default now(),
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, vocab_id)
);

create index if not exists korean_lessons_level_order_idx
  on public.korean_lessons(level, lesson_order);
create index if not exists korean_vocab_lesson_idx
  on public.korean_vocab(lesson_id);
create index if not exists korean_vocab_level_idx
  on public.korean_vocab(level);
create index if not exists korean_quiz_sessions_couple_created_idx
  on public.korean_quiz_sessions(couple_id, created_at desc);
create index if not exists korean_quiz_sessions_target_idx
  on public.korean_quiz_sessions(target_user);
create index if not exists korean_quiz_questions_session_idx
  on public.korean_quiz_questions(session_id);
create index if not exists korean_progress_user_next_review_idx
  on public.korean_progress(user_id, next_review_at);

drop trigger if exists korean_lessons_touch on public.korean_lessons;
create trigger korean_lessons_touch
  before update on public.korean_lessons
  for each row execute function public.touch_updated_at();
drop trigger if exists korean_vocab_touch on public.korean_vocab;
create trigger korean_vocab_touch
  before update on public.korean_vocab
  for each row execute function public.touch_updated_at();
drop trigger if exists korean_quiz_sessions_touch on public.korean_quiz_sessions;
create trigger korean_quiz_sessions_touch
  before update on public.korean_quiz_sessions
  for each row execute function public.touch_updated_at();
drop trigger if exists korean_quiz_questions_touch on public.korean_quiz_questions;
create trigger korean_quiz_questions_touch
  before update on public.korean_quiz_questions
  for each row execute function public.touch_updated_at();
drop trigger if exists korean_progress_touch on public.korean_progress;
create trigger korean_progress_touch
  before update on public.korean_progress
  for each row execute function public.touch_updated_at();

alter table public.korean_lessons enable row level security;
alter table public.korean_vocab enable row level security;
alter table public.korean_quiz_sessions enable row level security;
alter table public.korean_quiz_questions enable row level security;
alter table public.korean_progress enable row level security;

drop policy if exists korean_lessons_authenticated_read on public.korean_lessons;
create policy korean_lessons_authenticated_read
  on public.korean_lessons for select
  to authenticated using (true);

drop policy if exists korean_vocab_authenticated_read on public.korean_vocab;
create policy korean_vocab_authenticated_read
  on public.korean_vocab for select
  to authenticated using (true);

drop policy if exists korean_quiz_sessions_couple_access on public.korean_quiz_sessions;
create policy korean_quiz_sessions_couple_access
  on public.korean_quiz_sessions for all
  to authenticated
  using (public.is_couple_member(couple_id))
  with check (
    public.is_couple_member(couple_id)
    and created_by = auth.uid()
  );

drop policy if exists korean_quiz_questions_couple_access on public.korean_quiz_questions;
create policy korean_quiz_questions_couple_access
  on public.korean_quiz_questions for all
  to authenticated
  using (
    exists (
      select 1
      from public.korean_quiz_sessions session
      where session.id = korean_quiz_questions.session_id
        and public.is_couple_member(session.couple_id)
    )
  )
  with check (
    exists (
      select 1
      from public.korean_quiz_sessions session
      where session.id = korean_quiz_questions.session_id
        and public.is_couple_member(session.couple_id)
    )
  );

drop policy if exists korean_progress_own_access on public.korean_progress;
create policy korean_progress_own_access
  on public.korean_progress for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on public.korean_lessons to authenticated;
grant select on public.korean_vocab to authenticated;
grant select, insert, update, delete on public.korean_quiz_sessions to authenticated;
grant select, insert, update, delete on public.korean_quiz_questions to authenticated;
grant select, insert, update, delete on public.korean_progress to authenticated;

commit;
