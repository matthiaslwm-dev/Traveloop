# Urban Sprint

An Amazing Race-style campaign that runs alongside Traveloop. Teams sprint
between participating shops ("Stations"), a Gamemaster confirms each stop, and
the leaderboard moves live.

It is a **separate extension**, not a mode of the Traveloop app: its own routes
under `/urban-sprint`, its own login, its own roles, its own visual language.
The only thing the two share is Supabase Auth plumbing — and sharing that grants
nothing, because Urban Sprint access requires a `us_profiles` row and Traveloop's
console requires being `ADMIN_LOGIN_EMAIL`. Neither condition implies the other.

## Setup

Two steps, both against the Supabase project already configured in `.env.local`.

**1. Create the schema.** Open the Supabase dashboard → SQL Editor → New query,
paste [`supabase/urban-sprint-schema.sql`](supabase/urban-sprint-schema.sql) and
run it. It is idempotent, additive, and touches nothing the Traveloop tables use.

**2. Seed a runnable campaign** (optional, but it's how you see the thing work):

```bash
node supabase/seed-urban-sprint.mjs
```

That creates four categories, four boosters, six teams, twelve Penang stations
and one account per role. Sign in at `/urban-sprint/login`:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `control@urbansprint.test` | `sprint2026` |
| Gamemaster | `gm1@urbansprint.test` (also gm2, gm3) | `sprint2026` |
| Participant | `player1@urbansprint.test` (also player2–5) | `sprint2026` |

Override the password with `URBAN_SPRINT_SEED_PASSWORD`. These are demo
credentials — delete the accounts before running a real event.

No new environment variables are needed.

## Routes

| Path | Who |
| --- | --- |
| `/urban-sprint` | Public landing page |
| `/urban-sprint/leaderboard` | Public — no login, by design |
| `/urban-sprint/login` | Everyone |
| `/urban-sprint/admin` | Administrator |
| `/urban-sprint/gamemaster` | Gamemaster — claim, draw, stations |
| `/urban-sprint/gamemaster/leaderboard` | Gamemaster — board, in-shell |
| `/urban-sprint/team` | Participant — my team |
| `/urban-sprint/team/shops` | Participant — where to go |
| `/urban-sprint/team/leaderboard` | Participant — board, in-shell |
| `/urban-sprint/api/pulse` | The live-update heartbeat |

`proxy.ts` checks only that a session exists; the role decision is made by
`requireRole()` in the layout or action that serves the data, per the Next.js
guidance that proxy is for optimistic checks rather than authorisation. Every
Server Action re-checks independently, because Server Actions accept direct
POSTs.

## Scoring

Points are never stored as an incrementing counter. Each confirmation writes a
row to `us_completions` holding the whole calculation — base points, booster,
percentage, bonus, total, who confirmed it, when. `us_teams.cached_points` is a
cache rebuilt from that ledger **by database trigger**, so it cannot drift, and
voiding a completion recomputes it correctly.

```
ABC Cafe · Food & Beverage
  Base            30
  Food Booster    +25%   +7.5
  Awarded                37.5
```

The bonus applies when the station's category equals the booster's category. The
percentage lives on the booster row (`us_boosters.bonus_percent`) and is editable
in the console — there is no default constant anywhere in the scoring code. A
completion snapshots the percentage it was scored with, so re-pricing a station
or editing a booster later never rewrites a result a team already has.

All arithmetic happens in `src/lib/urban-sprint/scoring.ts`, server-side. The
gamemaster's confirmation sheet shows a *preview* produced by that same
function; the confirm posts only a station id, and the award is recomputed from
the database before anything is written.

### What stops the obvious abuses

| Risk | What actually prevents it |
| --- | --- |
| Duplicate station completion | Partial unique index on `(team_id, station_id) where status = 'valid'` |
| Double taps | The same index, plus a disabled button for the round trip |
| Two gamemasters claiming one team | `UPDATE … WHERE gamemaster_id IS NULL` — the loser's predicate no longer matches |
| One gamemaster on two teams | Unique index on `us_teams (gamemaster_id)` |
| Booster redraws | `UPDATE … WHERE booster_id IS NULL`; a repeat draw returns the booster already held |
| Frontend score manipulation | The client posts an id, never a number |
| Losing history to a correction | Voiding sets a status and a reason; nothing is deleted |

## Placeholder location data

The participant **Shops** tab shows a distance per shop and a Google map. Both
are fabricated, and live entirely in `src/lib/urban-sprint/geo.ts`:

- Distances come from a hash of the station id, so they are stable across
  refreshes and identical for everyone on a team — but they are not measured.
  `distanceFromTeam()` becomes real once stations carry lat/lng and the browser
  supplies a position; it already returns the shape the UI renders.
- Maps use Google's keyless embed (`maps?q=...&output=embed`), centred on an
  address rather than on the viewer. The official Embed API and a key are the
  production path; only the URL in that file changes.

The screen says so on both the area map and the detail sheet, so nobody reads
an invented number as a measurement.

## Live updates

Every scoring-relevant write bumps `us_settings.revision` by trigger. Open tabs
poll `/urban-sprint/api/pulse` (one primary-key read) and call `router.refresh()`
only when the number has moved — so pages stay Server Components with no second
client-side data layer, and a quiet minute costs almost nothing. Polling pauses
on a hidden tab.

Supabase Realtime would need the anon key and URL published to the browser,
which this project has so far kept server-side. Swapping transports later means
changing `_components/LiveRefresh.tsx` alone — nothing else knows how updates
arrive.

## Code map

```
src/lib/urban-sprint/      scoring, auth, and one *-db.ts per domain
src/app/urban-sprint/
  page.tsx                 public landing
  leaderboard/             public board
  login/                   sign-in + logout
  gamemaster/              claim team → draw booster → stations → confirm
  team/                    participant: my team, shops, board
                           (read-only by construction — no scoring control)
  admin/                   overview, users, teams, stations, categories,
                           boosters, activity, leaderboard
  _components/             shared UI, LiveRefresh, TabBar, AppBar
  urban-sprint.css         the whole design system, scoped to .us-root
supabase/urban-sprint-schema.sql
supabase/seed-urban-sprint.mjs
```

`urban-sprint.css` loads only on these routes and everything in it is scoped
under `.us-root`. `globals.css` is not edited.

## Deliberately not built

GPS, QR codes, photo proof, messaging, push notifications, timed missions and
analytics are all out of scope for the MVP. The seams are there for them:
stations already carry an address, completions are an append-only ledger a
verification step could hang off, and the live layer is one component wide.

Maps and distances exist only as the placeholders described above — real
positioning is the obvious next piece of work, and `geo.ts` is the only file it
touches.

Every bottom-navigation href must stay inside its own role's shell. A tab
pointing at a route rendered by a different layout navigates away from the bar
that rendered it, and the bar disappears mid-race. `_components/tabs.ts` is
where that rule lives.
