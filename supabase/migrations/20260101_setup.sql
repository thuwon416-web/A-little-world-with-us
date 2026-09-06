-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create tables if not exists
create table if not exists memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  title text,
  description text,
  photo_url text,
  created_at timestamp with time zone default now()
);

create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  title text,
  description text,
  progress int default 0,
  target int default 100,
  created_at timestamp with time zone default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references auth.users,
  receiver_id uuid references auth.users,
  content text,
  created_at timestamp with time zone default now()
);

create table if not exists todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  title text,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists daily_love_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  note text,
  scheduled_at timestamp with time zone,
  sent boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists feedback (
  id uuid primary key default uuid_generate_v4(),
  feedback text,
  created_at timestamp with time zone default now()
);

-- Calendar events
create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  date timestamp with time zone,
  title text,
  type text,
  created_at timestamp with time zone default now()
);

-- Mood logs
create table if not exists mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  mood int,
  note text,
  date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Financial goals
create table if not exists financial_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  title text,
  target_amount numeric,
  current_amount numeric default 0,
  created_at timestamp with time zone default now()
);

-- Create indexes for performance
create index if not exists memories_user_id_idx on memories(user_id);
create index if not exists goals_user_id_idx on goals(user_id);
create index if not exists messages_sender_id_idx on messages(sender_id);
create index if not exists todos_user_id_idx on todos(user_id);
create index if not exists calendar_events_user_id_idx on calendar_events(user_id);
create index if not exists calendar_events_date_idx on calendar_events(date);
create index if not exists mood_logs_user_id_idx on mood_logs(user_id);
create index if not exists mood_logs_date_idx on mood_logs(date);
create index if not exists financial_goals_user_id_idx on financial_goals(user_id);
