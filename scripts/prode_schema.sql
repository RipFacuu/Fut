-- Prode/Apuestas schema (Supabase/Postgres)
-- Safe re-runnable: uses IF NOT EXISTS and guards

-- Users table: rely on Supabase auth.users; optional mirror for profile
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz default now()
);

-- Settings table
create table if not exists public.prode_settings (
  id uuid primary key default gen_random_uuid(),
  cutoff_seconds_before_kickoff int not null default 600,
  fee_percent numeric(5,2) not null default 10.00,
  payout_mode text not null default 'pool', -- 'pool' | 'points'
  points_for_result int not null default 3,
  points_for_exact_score int not null default 5,
  max_bet numeric(12,2) default 10000.00,
  currency text not null default 'ARS',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Wallets (optional)
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  currency text not null default 'ARS',
  updated_at timestamptz default now()
);

-- Wallet transactions
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  currency text not null default 'ARS',
  reason text not null,
  meta jsonb,
  created_at timestamptz default now()
);
create index if not exists wallet_tx_user_idx on public.wallet_transactions(user_id);

-- Predictions / bets
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null, -- matches.id from existing 'partidos'
  predicted_outcome text not null check (predicted_outcome in ('home','draw','away')),
  predicted_score_home int,
  predicted_score_away int,
  bet_amount numeric(14,2) not null default 0,
  currency text not null default 'ARS',
  settled boolean not null default false,
  points_awarded int default 0,
  payout_amount numeric(14,2) default 0,
  tx_id uuid,
  created_at timestamptz default now(),
  unique (user_id, match_id)
);
create index if not exists predictions_match_idx on public.predictions(match_id);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Helper view: match aggregates for pool payouts
create or replace view public.predictions_aggregate as
select 
  match_id,
  sum(bet_amount) filter (where predicted_outcome = 'home') as pool_home,
  sum(bet_amount) filter (where predicted_outcome = 'draw') as pool_draw,
  sum(bet_amount) filter (where predicted_outcome = 'away') as pool_away,
  sum(bet_amount) as pool_total,
  count(*) as total_bets
from public.predictions
group by match_id;

-- RLS basic (adjust as needed)
alter table public.predictions enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='predictions' and policyname='predictions_select_own_or_public'
  ) then
    create policy predictions_select_own_or_public on public.predictions
      for select using (auth.role() = 'anon' or user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='predictions' and policyname='predictions_insert_self'
  ) then
    create policy predictions_insert_self on public.predictions
      for insert with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='predictions' and policyname='predictions_update_self_unsettled'
  ) then
    create policy predictions_update_self_unsettled on public.predictions
      for update using (user_id = auth.uid() and settled = false) with check (user_id = auth.uid());
  end if;
end $$;


