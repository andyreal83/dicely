-- Board Game Scorer schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'setup' check (status in ('setup', 'active', 'finished')),
  winner_name text,
  winner_score integer,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now()
);

alter table games
  add column if not exists current_player_id uuid references players(id) on delete set null;

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  value integer not null,
  created_at timestamptz not null default now()
);

create index if not exists players_game_id_idx on players(game_id);
create index if not exists scores_player_id_idx on scores(player_id);
create index if not exists scores_game_id_idx on scores(game_id);

-- Row Level Security: this app has no login, so we open access to the anon
-- key. Only share your Supabase URL/anon key with people you trust to use
-- the app — anyone with them can read and write all games.
alter table games enable row level security;
alter table players enable row level security;
alter table scores enable row level security;

create policy "public access" on games for all using (true) with check (true);
create policy "public access" on players for all using (true) with check (true);
create policy "public access" on scores for all using (true) with check (true);
