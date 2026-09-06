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

-- Create indexes for performance
create index if not exists memories_user_id_idx on memories(user_id);
create index if not exists goals_user_id_idx on goals(user_id);
create index if not exists messages_sender_id_idx on messages(sender_id);
create index if not exists messages_receiver_id_idx on messages(receiver_id);
create index if not exists todos_user_id_idx on todos(user_id);
