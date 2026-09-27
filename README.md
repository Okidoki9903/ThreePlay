# ThreePlay

**Free Three.js games. Instantly playable.**

ThreePlay is a discovery and rating platform for free browser games built with [Three.js](https://threejs.org) (WebGL / WebGPU). Players can browse, play, rate, review and favorite games. Developers can submit a URL or upload a static build that ThreePlay hosts for them. Moderators approve submissions and handle reports.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui-style components**, **Framer Motion** and **Supabase** (Postgres, Auth, Storage).

---

## Features

| Area | What's included |
| --- | --- |
| **Discovery** | Hero with a featured game over a live Three.js backdrop, trending this week, new releases, top rated, categories, popular tags, search (full-text + title/tag match), sort and filters, infinite scroll with a "Load more" fallback |
| **Game page** | Click-to-play sandboxed iframe, fullscreen, reload, screenshot carousel (swipe/arrow keys), star rating + distribution, reviews, tags, developer, release date, play count, favorites, share menu, report dialog, related games, JSON-LD and Open Graph |
| **Keyboard shortcuts** | `Enter`/`P` play · `F` fullscreen · `R` reload · `L` favorite · `S` share · `N` random next game · `/` search · `?` help |
| **Submissions** | URL or `.zip` upload, cover + up to 8 screenshots/GIFs, tags, controls, credits. Three.js is **auto-detected** (HTML, import maps, bundles, `REVISION`), and URLs that block iframes are flagged |
| **Hosting** | Zip builds are unpacked into private storage and served from `/play/<id>/…` inside an opaque-origin sandbox |
| **Accounts** | Email magic link, Google and GitHub through Supabase Auth. Profiles show recently played games (visible only to you), favorites, ratings and submissions |
| **Ratings** | One rating per user per game, which can be edited or deleted. Averages are kept in sync by a database trigger, and hidden reviews are excluded |
| **Admin** | Approval queue with preview and rejection reasons, feature/unfeature and delete games, hide/delete reviews, resolve/dismiss reports |
| **Extras** | Random game (`/random`), weekly leaderboards (most played and highest rated), sitemap, robots, generated OG image, Vercel Analytics, skip link, reduced motion support, responsive down to 320px |

## Project structure

```
src/
  app/
    page.tsx                  Home / discovery
    games/                    Browse (+ /api/games for infinite scroll)
    games/[slug]/             Game page
    categories/[slug]/        Category browse
    leaderboard/              Weekly leaderboards
    random/route.ts           Redirect to a random game
    submit/                   Submission form
    u/[username]/             Public profile
    settings/                 Edit profile
    admin/                    Queue, games, reviews, reports
    login/, auth/*            Sign-in UI, OAuth/magic-link callbacks, sign-out
    play/[id]/[...path]/      Serves hosted zip builds (sandboxed)
    sitemap.ts, robots.ts, opengraph-image.tsx
  components/
    ui/                       shadcn-style primitives (button, dialog, tabs, …)
    layout/, home/, browse/, game/, admin/
  lib/
    supabase/                 Server, browser, middleware and service-role clients
    actions/                  Server actions (games, reviews, favorites, reports, profile, admin)
    queries.ts                Read-side data access
    detect-threejs.ts         Three.js detection for URLs
    hosted-build.ts           Zip validation, extraction and upload
    validation.ts             Zod schemas
    database.types.ts         Typed schema for supabase-js
  middleware.ts               Session refresh and auth-gated routes
supabase/
  migrations/…_init.sql       Schema, triggers, RPCs, RLS, storage buckets and policies
  seed.sql                    Categories, 10 games, demo users, plays, reviews
  config.toml                 Local Supabase configuration
```

## Database schema

```
profiles    (id → auth.users, username unique, display_name, avatar_url, bio, website, role user|admin)
categories  (slug pk, name, description, icon, sort_order)
games       (id, slug unique, title, short/long description, category_slug → categories, tags[],
             cover_url, screenshots[], game_url, is_hosted, controls, developer_name/url, source_url,
             submitted_by → profiles, status pending|approved|rejected, rejection_reason,
             is_featured, featured_at, threejs_detected, threejs_revision,
             play_count, rating_avg, rating_count, released_at, approved_at, search tsvector)
reviews     (id, game_id, user_id, rating 1–5, body, is_hidden, UNIQUE(game_id, user_id))
favorites   (user_id, game_id) pk
plays       (id, game_id, user_id nullable, created_at)   append-only; drives trending
reports     (id, game_id, review_id?, reporter_id, reason enum, details, status open|resolved|dismissed)
```

**Triggers:** `handle_new_user` creates a profile with a unique username on sign-up. `reviews_rating_sync` keeps `rating_avg` and `rating_count` in sync. `games_guard` makes sure users can't self-approve, self-feature or inflate counters.

**RPCs:** `record_play` (deduplicated per user every 30 minutes; anonymous plays are deduplicated by cookie), `trending_games`, `top_rated_recent`, `random_game_slug`, `popular_tags`.

**RLS:** anyone can read approved games, visible reviews, categories and profiles. Users can read their own pending games and play history. Users write only their own reviews, favorites, reports and profile. Column grants block users from changing `role` or `is_hidden`. Admin mutations run through the service role, and only after a `requireAdmin()` check.

**Storage buckets:**
- `game-media` (public): covers and screenshots. Users write to `<uid>/…`.
- `game-uploads` (private): raw zips. Users write to `<uid>/…`.
- `game-builds` (private): unpacked builds. Only the server writes here.

---

## Getting started (local)

### Prerequisites
- Node.js 20+
- Docker, to run Supabase locally. You can also use a hosted Supabase project; see below.

### 1. Install

```bash
npm install
```

### 2. Start Supabase locally

```bash
npx supabase start          # first run pulls Docker images (a few minutes)
npx supabase db reset       # applies migrations + seed.sql
```

`supabase start` prints the API URL, the anon key and the service_role key.

### 3. Configure env

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your production URL on Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | `API URL` from `supabase start` (`http://127.0.0.1:54321`) or Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon key` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role key` / secret key. **Server only; never expose it** |

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000. Locally, magic-link emails are caught by Mailpit/Inbucket at http://127.0.0.1:54324.

### 5. Make yourself an admin

Sign in once, then run this in the SQL editor (Studio at http://127.0.0.1:54323, or `psql`):

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

An **Admin** entry then appears in your account menu.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build and start |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the local database |

---

## Authentication providers

**Email magic link** works with no extra setup.

**GitHub:** create an OAuth App at https://github.com/settings/developers.
- Callback URL: `https://<project-ref>.supabase.co/auth/v1/callback` (locally: `http://127.0.0.1:54321/auth/v1/callback`)

**Google:** create an OAuth client ID ("Web application") in Google Cloud Console → APIs & Services → Credentials.
- Authorized redirect URI: the same Supabase callback as above

Then:
- **Hosted:** Supabase Dashboard → Authentication → Providers → enable GitHub/Google and paste the client ID and secret. Under Authentication → URL Configuration, set **Site URL** to your domain and add `https://your-domain/**` to the redirect URLs.
- **Local:** create `supabase/.env` with `SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`. Set `enabled = true` for the providers in `supabase/config.toml`, then restart with `npx supabase stop && npx supabase start`.

---

## Deploying (Vercel + Supabase)

1. **Create a Supabase project** at https://supabase.com.
2. **Apply the schema:**
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push                     # runs supabase/migrations
   ```
   Seed demo content (optional): paste `supabase/seed.sql` into the SQL editor. It also creates three demo users that cannot log in; delete them later if you like.
3. **Configure auth** providers and URLs as described above.
4. **Import the repo into Vercel.** Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` for Production and Preview.
5. **Enable Vercel Analytics** under Project → Analytics. The `<Analytics />` component is already mounted.
6. Deploy. Sign in, promote yourself to admin (SQL above), and start approving games.

---

## Security notes

- **External games** are embedded with `sandbox="allow-scripts allow-pointer-lock allow-same-origin …"`. Because they are on a different origin, `allow-same-origin` only lets them use their *own* storage.
- **Hosted builds** are served by `/play/[id]/…` with `Content-Security-Policy: sandbox …`, and the iframe never gets `allow-same-origin`. The document therefore always runs in an opaque origin, even if someone opens the URL directly, and it cannot read ThreePlay cookies. Responses send `Access-Control-Allow-Origin: *` so module scripts and texture/model fetches still work. **Recommended hardening for production:** serve hosted builds from a separate domain (for example `play.threeplay-cdn.com` pointing to the same deployment, or a static bucket/CDN), so user code never shares a registrable domain with the main site.
- Zip extraction rejects path traversal, caps files at 2,000 and the total at 150 MB, and ignores dotfiles and `__MACOSX`.
- Three.js detection fetches only public `http(s)` URLs, rejects literal private IPs and localhost, and uses timeouts and size caps. For stricter SSRF protection, run detection behind an egress proxy.
- All pages except `/play` send `frame-ancestors 'self'`.
- Uploaded images must come from the submitter's own folder in `game-media`.

## Seed games

The seed uses real, public Three.js games and demos. Their copyright stays with the original authors.

| Game | Source |
| --- | --- |
| The Aviator | Karim Maaloul, Codrops (tympanus.net) |
| Octree Arena | threejs.org `games_fps` |
| Tower Blocks | Steve Gardner (CodePen) |
| Crossy Road 3D | Hunor Márton Borbély (CodePen) |
| Box Hopper | threejs.org `misc_controls_pointerlock` |
| Demolition Lab | threejs.org `physics_ammo_break` |
| Voxel Painter | threejs.org `webgl_interactive_voxelpainter` |
| GPGPU Flock | threejs.org `webgl_gpgpu_birds` |
| Open Ocean | threejs.org `webgl_shaders_ocean` |
| Jelly Physics | threejs.org `physics_ammo_volume` |

Covers for the three non-threejs.org games are original SVG illustrations in `public/seed/`.

## Roadmap ideas

- Comments on reviews and developer replies
- Collections and playlists
- Per-game leaderboards via a small postMessage SDK
- Developer analytics dashboard (plays over time)
- WebGPU capability badge detection
- Full-text search ranking with `ts_rank`
