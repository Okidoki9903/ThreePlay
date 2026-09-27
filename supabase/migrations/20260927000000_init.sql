-- =============================================================================
-- ThreePlay — initial schema
-- Tables, enums, triggers, RPC functions, row level security and storage.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('user', 'admin');
create type public.game_status as enum ('pending', 'approved', 'rejected');
create type public.report_status as enum ('open', 'resolved', 'dismissed');
create type public.report_reason as enum ('broken', 'not_threejs', 'inappropriate', 'malware', 'copyright', 'spam', 'other');

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique
                 check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url   text,
  bio          text check (char_length(bio) <= 280),
  website      text check (char_length(website) <= 200),
  role         public.user_role not null default 'user',
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
create table public.categories (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text not null default '',
  icon        text not null default 'gamepad-2',
  sort_order  int  not null default 0
);

-- -----------------------------------------------------------------------------
-- Games
-- -----------------------------------------------------------------------------
create table public.games (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title             text not null check (char_length(title) between 2 and 80),
  short_description text not null check (char_length(short_description) between 10 and 160),
  long_description  text not null default '' check (char_length(long_description) <= 10000),
  category_slug     text not null references public.categories (slug) on update cascade,
  tags              text[] not null default '{}' check (cardinality(tags) <= 10),
  cover_url         text not null,
  screenshots       text[] not null default '{}' check (cardinality(screenshots) <= 8),
  game_url          text not null,
  is_hosted         boolean not null default false,   -- true when the build lives in our storage (zip upload)
  controls          text not null default '' check (char_length(controls) <= 2000),
  developer_name    text not null check (char_length(developer_name) between 1 and 60),
  developer_url     text,
  source_url        text,
  submitted_by      uuid references public.profiles (id) on delete set null,
  status            public.game_status not null default 'pending',
  rejection_reason  text,
  is_featured       boolean not null default false,
  featured_at       timestamptz,
  threejs_detected  boolean,                          -- null = could not check
  threejs_revision  text,
  play_count        integer not null default 0,
  rating_avg        numeric(3, 2) not null default 0,
  rating_count      integer not null default 0,
  released_at       date not null default current_date,
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  search            tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(developer_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(long_description, '')), 'C')
  ) stored
);

create index games_status_created_idx   on public.games (status, created_at desc);
create index games_status_plays_idx     on public.games (status, play_count desc);
create index games_status_rating_idx    on public.games (status, rating_avg desc, rating_count desc);
create index games_category_idx         on public.games (category_slug) where status = 'approved';
create index games_featured_idx         on public.games (featured_at desc) where is_featured;
create index games_tags_idx             on public.games using gin (tags);
create index games_search_idx           on public.games using gin (search);
create index games_title_trgm_idx       on public.games using gin (title extensions.gin_trgm_ops);
create index games_submitted_by_idx     on public.games (submitted_by);

-- -----------------------------------------------------------------------------
-- Reviews (one per user per game)
-- -----------------------------------------------------------------------------
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  body       text not null default '' check (char_length(body) <= 2000),
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create index reviews_game_idx on public.reviews (game_id, created_at desc);
create index reviews_user_idx on public.reviews (user_id, created_at desc);
create index reviews_recent_idx on public.reviews (created_at desc);

-- -----------------------------------------------------------------------------
-- Favorites
-- -----------------------------------------------------------------------------
create table public.favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  game_id    uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index favorites_game_idx on public.favorites (game_id);

-- -----------------------------------------------------------------------------
-- Plays (append-only log, drives trending + "recently played")
-- -----------------------------------------------------------------------------
create table public.plays (
  id         bigint generated always as identity primary key,
  game_id    uuid not null references public.games (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index plays_game_time_idx on public.plays (game_id, created_at desc);
create index plays_time_idx      on public.plays (created_at desc);
create index plays_user_idx      on public.plays (user_id, created_at desc) where user_id is not null;

-- -----------------------------------------------------------------------------
-- Reports
-- -----------------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  review_id   uuid references public.reviews (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason      public.report_reason not null,
  details     text not null default '' check (char_length(details) <= 1000),
  status      public.report_status not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_status_idx on public.reports (status, created_at desc);

-- =============================================================================
-- Helper functions & triggers
-- =============================================================================

-- Is the current user an admin? SECURITY DEFINER so it can be used inside RLS
-- policies on profiles without recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

-- Create a profile for every new auth user, deriving a unique username.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_name text;
  candidate text;
  n int := 0;
begin
  base_name := lower(regexp_replace(
    coalesce(
      new.raw_user_meta_data ->> 'user_name',          -- GitHub
      new.raw_user_meta_data ->> 'preferred_username',
      split_part(new.email, '@', 1),
      'player'
    ),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  if char_length(base_name) < 3 then
    base_name := base_name || 'player';
  end if;
  base_name := left(base_name, 18);
  candidate := base_name;

  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base_name || n::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', candidate), 60),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recompute the cached rating aggregate for a game (hidden reviews excluded).
create or replace function public.refresh_game_rating(p_game_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.games g
  set rating_avg   = coalesce(s.avg, 0),
      rating_count = coalesce(s.cnt, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg, count(*)::int as cnt
    from public.reviews
    where game_id = p_game_id and not is_hidden
  ) s
  where g.id = p_game_id;
$$;

create or replace function public.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_game_rating(old.game_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_game_rating(new.game_id);
  end if;
  return null;
end;
$$;

create trigger reviews_rating_sync
  after insert or update of rating, is_hidden or delete on public.reviews
  for each row execute function public.on_review_change();

-- Guard columns that normal users must never set on their own submissions.
create or replace function public.guard_game_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only API requests made with a user/anon JWT are guarded. Direct SQL (seeds,
  -- dashboard), the service_role key and admins may set anything.
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.is_featured := false;
    new.featured_at := null;
    new.play_count := 0;
    new.rating_avg := 0;
    new.rating_count := 0;
    new.approved_at := null;
    new.rejection_reason := null;
    new.submitted_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger games_guard before insert on public.games
  for each row execute function public.guard_game_columns();

-- =============================================================================
-- RPC functions (callable via supabase.rpc)
-- =============================================================================

-- Record a play. De-duplicates per signed-in user (30 min window).
-- Anonymous de-duplication happens in the app via a cookie.
create or replace function public.record_play(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if not exists (select 1 from public.games where id = p_game_id and status = 'approved') then
    return;
  end if;

  if uid is not null and exists (
    select 1 from public.plays
    where game_id = p_game_id and user_id = uid and created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into public.plays (game_id, user_id) values (p_game_id, uid);
  update public.games set play_count = play_count + 1 where id = p_game_id;
end;
$$;

-- Most played approved games over the last N days.
create or replace function public.trending_games(p_days int default 7, p_limit int default 12)
returns table (game_id uuid, plays bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.game_id, count(*) as plays
  from public.plays p
  join public.games g on g.id = p.game_id and g.status = 'approved'
  where p.created_at > now() - make_interval(days => p_days)
  group by p.game_id
  order by plays desc, max(p.created_at) desc
  limit least(p_limit, 100);
$$;

-- Highest rated approved games by reviews written in the last N days.
create or replace function public.top_rated_recent(p_days int default 7, p_limit int default 12, p_min_ratings int default 1)
returns table (game_id uuid, avg_rating numeric, ratings bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.game_id, round(avg(r.rating)::numeric, 2) as avg_rating, count(*) as ratings
  from public.reviews r
  join public.games g on g.id = r.game_id and g.status = 'approved'
  where r.created_at > now() - make_interval(days => p_days)
    and not r.is_hidden
  group by r.game_id
  having count(*) >= p_min_ratings
  order by avg_rating desc, ratings desc
  limit least(p_limit, 100);
$$;

-- Random approved game slug (used by the "Random game" button).
create or replace function public.random_game_slug(p_exclude uuid default null)
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select slug from public.games
  where status = 'approved' and (p_exclude is null or id <> p_exclude)
  order by random()
  limit 1;
$$;

-- All distinct tags on approved games with counts (tag cloud / filters).
create or replace function public.popular_tags(p_limit int default 30)
returns table (tag text, uses bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select t.tag, count(*) as uses
  from public.games g, unnest(g.tags) as t(tag)
  where g.status = 'approved'
  group by t.tag
  order by uses desc, t.tag
  limit least(p_limit, 200);
$$;

-- =============================================================================
-- Row level security
-- =============================================================================
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.games      enable row level security;
alter table public.reviews    enable row level security;
alter table public.favorites  enable row level security;
alter table public.plays      enable row level security;
alter table public.reports    enable row level security;

-- profiles --------------------------------------------------------------------
create policy "profiles are public" on public.profiles
  for select using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Users may only change these columns (role stays admin-only via service role).
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_url, bio, website) on public.profiles to authenticated;

-- categories ------------------------------------------------------------------
create policy "categories are public" on public.categories
  for select using (true);

-- games -----------------------------------------------------------------------
create policy "approved games are public" on public.games
  for select using (
    status = 'approved'
    or submitted_by = auth.uid()
    or public.is_admin()
  );
create policy "signed-in users submit games" on public.games
  for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending');
create policy "admins update games" on public.games
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins delete games" on public.games
  for delete to authenticated
  using (public.is_admin());

-- reviews ---------------------------------------------------------------------
create policy "visible reviews are public" on public.reviews
  for select using (not is_hidden or user_id = auth.uid() or public.is_admin());
create policy "users write own review" on public.reviews
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and is_hidden = false
    and exists (select 1 from public.games g where g.id = game_id and g.status = 'approved')
  );
create policy "users edit own review" on public.reviews
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users or admins delete review" on public.reviews
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke update on public.reviews from anon, authenticated;
grant update (rating, body) on public.reviews to authenticated;

-- favorites -------------------------------------------------------------------
create policy "favorites are public" on public.favorites
  for select using (true);
create policy "users add own favorites" on public.favorites
  for insert to authenticated with check (user_id = auth.uid());
create policy "users remove own favorites" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

-- plays -----------------------------------------------------------------------
-- Inserts only through record_play(); users can read their own history.
create policy "users read own plays" on public.plays
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- reports ---------------------------------------------------------------------
create policy "anyone signed-in can report" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy "admins read reports" on public.reports
  for select to authenticated using (public.is_admin());
create policy "admins update reports" on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Function execution grants ------------------------------------------------------
revoke execute on function public.refresh_game_rating(uuid) from public, anon, authenticated;
grant execute on function public.record_play(uuid) to anon, authenticated;
grant execute on function public.trending_games(int, int) to anon, authenticated;
grant execute on function public.top_rated_recent(int, int, int) to anon, authenticated;
grant execute on function public.random_game_slug(uuid) to anon, authenticated;
grant execute on function public.popular_tags(int) to anon, authenticated;

-- =============================================================================
-- Storage
-- =============================================================================
-- game-media   : public covers / screenshots, users write to "<uid>/..."
-- game-uploads : private zip uploads, users write to "<uid>/..."
-- game-builds  : private extracted builds, written & served by the server only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('game-media',   'game-media',   true,  5242880,  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']),
  ('game-uploads', 'game-uploads', false, 52428800, array['application/zip', 'application/x-zip-compressed', 'application/octet-stream']),
  ('game-builds',  'game-builds',  false, 52428800, null)
on conflict (id) do nothing;

create policy "media is public" on storage.objects
  for select using (bucket_id = 'game-media');
create policy "users upload own media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'game-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'game-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users upload own zips" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'game-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own zips" on storage.objects
  for select to authenticated
  using (bucket_id = 'game-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
