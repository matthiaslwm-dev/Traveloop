-- Urban Sprint — schema for the Amazing Race-style campaign extension.
--
-- Run this in the Supabase SQL editor AFTER schema.sql (Project > SQL Editor >
-- New query). Safe to re-run: every statement is idempotent.
--
-- Everything here is prefixed `us_` and is deliberately disjoint from the
-- Traveloop tables. The only shared object is auth.users: an Urban Sprint
-- account is a Supabase Auth user *plus* a row in us_profiles, and it is that
-- row — not the auth session — which grants any Urban Sprint access. A
-- Traveloop customer with no us_profiles row has none, and an Urban Sprint
-- admin is not the Traveloop operator (that stays ADMIN_LOGIN_EMAIL), so
-- neither side inherits the other's permissions.
--
-- Like the Traveloop tables, RLS is enabled with no policies: the app reaches
-- these tables exclusively through the service-role client in server code
-- (src/lib/urban-sprint/*), so RLS denying by default is the intent, not an
-- oversight. Scores are never written from the browser.


-- ---------------------------------------------------------------------------
-- Settings — one row, id = 1.
-- ---------------------------------------------------------------------------
-- `revision` is the live-update cursor: every scoring-relevant write bumps it
-- (see us_bump_revision below) and /urban-sprint/api/pulse hands it to the
-- browser, which refreshes when the number moves. Keeping it in one row makes
-- the poll a single-row primary-key read.
create table if not exists us_settings (
  id smallint primary key default 1 check (id = 1),
  event_name text not null default 'Urban Sprint',
  event_tagline text not null default 'One city. Twelve teams. Ninety minutes of chaos.',
  -- Drives the public landing page's status banner.
  event_status text not null default 'upcoming'
    check (event_status in ('upcoming', 'live', 'paused', 'ended')),
  event_starts_at timestamptz,
  event_location text not null default 'George Town, Penang',
  -- The base points a newly created Station starts with. Editable here rather
  -- than hardcoded in the form.
  default_base_points numeric(10, 2) not null default 30,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table us_settings enable row level security;

insert into us_settings (id) values (1) on conflict (id) do nothing;

create or replace function us_bump_revision() returns void as $$
  update us_settings set revision = revision + 1, updated_at = now() where id = 1;
$$ language sql;

-- Generic AFTER trigger for tables whose changes should wake up open clients.
create or replace function us_touch_revision() returns trigger as $$
begin
  perform us_bump_revision();
  return null;
end;
$$ language plpgsql;


-- ---------------------------------------------------------------------------
-- Profiles — the Urban Sprint role, and the gate for the whole extension.
-- ---------------------------------------------------------------------------
create table if not exists us_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'gamemaster', 'participant')),
  display_name text not null default '',
  phone text,
  -- Lets an admin suspend an account without deleting it (and losing the
  -- completion history that references it).
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table us_profiles enable row level security;

create index if not exists us_profiles_role_idx on us_profiles (role, created_at desc);


-- ---------------------------------------------------------------------------
-- Categories — shared vocabulary for Stations and Boosters.
-- ---------------------------------------------------------------------------
create table if not exists us_categories (
  id bigint generated always as identity primary key,
  name text not null,
  -- Stable machine name; the display `name` can be renamed without breaking
  -- anything that stored a reference.
  slug text not null unique,
  -- Hex accent used for the category chip on every surface.
  color text not null default '#7c5cff',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table us_categories enable row level security;

drop trigger if exists us_categories_revision on us_categories;
create trigger us_categories_revision
  after insert or update or delete on us_categories
  for each statement execute function us_touch_revision();


-- ---------------------------------------------------------------------------
-- Boosters — a category plus the bonus percentage awarded on a match.
-- ---------------------------------------------------------------------------
-- bonus_percent is per-booster data, never a constant in application code, so
-- an operator can run "+25%" one weekend and "+40%" the next without a deploy.
create table if not exists us_boosters (
  id bigint generated always as identity primary key,
  name text not null,
  category_id bigint not null references us_categories(id) on delete restrict,
  bonus_percent numeric(6, 2) not null default 25 check (bonus_percent >= 0),
  description text not null default '',
  -- Only active boosters are eligible for the draw. Deactivating one leaves
  -- teams that already drew it untouched.
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table us_boosters enable row level security;

create index if not exists us_boosters_active_idx on us_boosters (active);

drop trigger if exists us_boosters_revision on us_boosters;
create trigger us_boosters_revision
  after insert or update or delete on us_boosters
  for each statement execute function us_touch_revision();


-- ---------------------------------------------------------------------------
-- Teams.
-- ---------------------------------------------------------------------------
-- cached_points / cached_completions are a *derived* cache, rebuilt from
-- us_completions by trigger — never incremented in application code. The
-- completion rows remain the source of truth, so voiding one recomputes the
-- total correctly instead of leaving a drifted counter behind.
create table if not exists us_teams (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  color text not null default '#ff5c38',
  -- A team is claimed by exactly one gamemaster, and a gamemaster runs
  -- exactly one team — enforced by the unique index below, so two phones
  -- racing to claim the same team cannot both win.
  --
  -- These people columns reference us_profiles rather than auth.users: it
  -- makes "only an Urban Sprint account can hold this role" a database rule,
  -- and it gives PostgREST a relationship to embed the person's name through.
  -- us_profiles cascades from auth.users, so deleting the auth account still
  -- propagates.
  gamemaster_id uuid references us_profiles(user_id) on delete set null,
  claimed_at timestamptz,
  booster_id bigint references us_boosters(id) on delete set null,
  booster_drawn_at timestamptz,
  cached_points numeric(12, 2) not null default 0,
  cached_completions integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table us_teams enable row level security;

-- One team per gamemaster. Partial so the many unclaimed teams (NULL) don't
-- collide with each other.
create unique index if not exists us_teams_one_team_per_gamemaster
  on us_teams (gamemaster_id)
  where gamemaster_id is not null;

create index if not exists us_teams_leaderboard_idx
  on us_teams (cached_points desc, cached_completions desc, created_at asc);

drop trigger if exists us_teams_revision on us_teams;
create trigger us_teams_revision
  after insert or update or delete on us_teams
  for each statement execute function us_touch_revision();


-- ---------------------------------------------------------------------------
-- Team membership — participants.
-- ---------------------------------------------------------------------------
-- user_id is the primary key, not (team_id, user_id): a participant belongs
-- to at most one team, so reassigning is an upsert rather than a
-- delete-then-insert that could momentarily leave them on two.
create table if not exists us_team_members (
  user_id uuid primary key references us_profiles(user_id) on delete cascade,
  team_id bigint not null references us_teams(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table us_team_members enable row level security;

create index if not exists us_team_members_team_idx on us_team_members (team_id);

drop trigger if exists us_team_members_revision on us_team_members;
create trigger us_team_members_revision
  after insert or update or delete on us_team_members
  for each statement execute function us_touch_revision();


-- ---------------------------------------------------------------------------
-- Stations — the participating shops.
-- ---------------------------------------------------------------------------
create table if not exists us_stations (
  id bigint generated always as identity primary key,
  name text not null,
  business_name text not null default '',
  category_id bigint not null references us_categories(id) on delete restrict,
  address text not null default '',
  instructions text not null default '',
  -- Seeded from us_settings.default_base_points at creation time, then
  -- editable per station.
  base_points numeric(10, 2) not null default 30 check (base_points >= 0),
  active boolean not null default true,
  -- Gamemasters may add a station they find in the field; this records who.
  created_by uuid references us_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table us_stations enable row level security;

create index if not exists us_stations_active_idx on us_stations (active, name);
create index if not exists us_stations_category_idx on us_stations (category_id);

drop trigger if exists us_stations_revision on us_stations;
create trigger us_stations_revision
  after insert or update or delete on us_stations
  for each statement execute function us_touch_revision();


-- ---------------------------------------------------------------------------
-- Completions — the auditable score ledger.
-- ---------------------------------------------------------------------------
-- One row per station a team completed. Every number that went into the award
-- is snapshotted here, so re-pricing a station or retiring a booster later
-- cannot rewrite what a team was already given, and an admin can reconstruct
-- any score from the ledger alone.
--
-- Voiding sets status = 'void' rather than deleting: history is preserved and
-- the team total is recomputed by trigger.
create table if not exists us_completions (
  id bigint generated always as identity primary key,
  team_id bigint not null references us_teams(id) on delete cascade,
  station_id bigint not null references us_stations(id) on delete restrict,
  -- Who confirmed it. Nullable only so removing a gamemaster's account
  -- doesn't erase the score record.
  gamemaster_id uuid references us_profiles(user_id) on delete set null,
  station_name text not null,
  category_id bigint references us_categories(id) on delete set null,
  category_name text not null default '',
  base_points numeric(10, 2) not null,
  booster_id bigint references us_boosters(id) on delete set null,
  booster_name text not null default '',
  -- 0 when the booster didn't match the station's category, so the row always
  -- shows the full arithmetic.
  bonus_percent numeric(6, 2) not null default 0,
  bonus_points numeric(10, 2) not null default 0,
  booster_applied boolean not null default false,
  total_points numeric(10, 2) not null,
  status text not null default 'valid' check (status in ('valid', 'void')),
  voided_at timestamptz,
  voided_by uuid references us_profiles(user_id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now()
);

alter table us_completions enable row level security;

-- The duplicate-completion guard, and the double-tap guard: a second insert
-- for the same team + station loses with a unique violation, which the action
-- layer turns into "already completed" rather than a second award. Partial on
-- status so a voided completion can legitimately be re-done later.
create unique index if not exists us_completions_one_valid_per_team_station
  on us_completions (team_id, station_id)
  where status = 'valid';

create index if not exists us_completions_team_idx on us_completions (team_id, created_at desc);
create index if not exists us_completions_feed_idx on us_completions (created_at desc);

-- Rebuilds the cached team totals from the ledger. Runs for every insert,
-- update (a void) and delete, so the cache cannot drift from the records it
-- summarises.
create or replace function us_refresh_team_totals() returns trigger as $$
declare
  target_team bigint := coalesce(new.team_id, old.team_id);
begin
  update us_teams t
  set cached_points = coalesce(
        (select sum(c.total_points) from us_completions c
          where c.team_id = t.id and c.status = 'valid'), 0),
      cached_completions = coalesce(
        (select count(*) from us_completions c
          where c.team_id = t.id and c.status = 'valid'), 0),
      updated_at = now()
  where t.id = target_team;

  perform us_bump_revision();
  return null;
end;
$$ language plpgsql;

drop trigger if exists us_completions_totals on us_completions;
create trigger us_completions_totals
  after insert or update or delete on us_completions
  for each row execute function us_refresh_team_totals();


-- ---------------------------------------------------------------------------
-- Leaderboard view.
-- ---------------------------------------------------------------------------
-- Ranking is decided here rather than in TypeScript so the public board, the
-- gamemaster's "you're 3rd" and the admin table can never disagree. rank()
-- (not row_number) so teams level on score genuinely tie; ties break on more
-- stations first, then on who was created first.
create or replace view us_leaderboard as
select
  t.id,
  t.name,
  t.slug,
  t.color,
  t.cached_points as points,
  t.cached_completions as stations_completed,
  t.booster_id,
  b.name as booster_name,
  b.bonus_percent,
  cat.name as booster_category,
  cat.color as booster_category_color,
  t.gamemaster_id,
  rank() over (
    order by t.cached_points desc, t.cached_completions desc, t.created_at asc
  ) as rank
from us_teams t
left join us_boosters b on b.id = t.booster_id
left join us_categories cat on cat.id = b.category_id
where t.active;
