// Resets Urban Sprint to a clean pre-race state, without touching anything
// Traveloop owns.
//
//   node supabase/reset-urban-sprint.mjs
//
// What it does:
//   1. Deletes every completion (the score ledger goes back to empty).
//   2. Releases every team — no gamemaster, no booster drawn, zero points.
//   3. Removes stations and teams that aren't part of the seed, so the
//      leftovers from a test run don't clutter the demo.
//   4. Re-runs nothing — pair it with seed-urban-sprint.mjs if you also want
//      booster percentages and station pricing restored to their seeded values.
//
// Accounts are left alone: deleting a person is not "resetting data", and any
// extra ones are reported so you can decide.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {
    // rely on exported env vars
  }
}

loadEnvLocal();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local).");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const SEED_TEAMS = [
  "night-owls",
  "street-cats",
  "monsoon-crew",
  "lantern-squad",
  "harbour-rats",
  "kopi-kings",
];

const SEED_STATIONS = [
  "ABC Cafe",
  "Toh Soon Alley",
  "Chulia Night Bites",
  "Batik & Co",
  "The Tin Shop",
  "Kaki Lima Books",
  "Rehat Spa",
  "Gunting Barber",
  "Khoo Kongsi",
  "Street Art Wall",
  "Peranakan House",
  "Chew Jetty",
];

const SEED_EMAILS = [
  "control@urbansprint.test",
  "gm1@urbansprint.test",
  "gm2@urbansprint.test",
  "gm3@urbansprint.test",
  "player1@urbansprint.test",
  "player2@urbansprint.test",
  "player3@urbansprint.test",
  "player4@urbansprint.test",
  "player5@urbansprint.test",
];

// 1. Clear the ledger. Doing this first is what makes the deletes below legal:
//    stations are `on delete restrict` from completions.
const { count: hadCompletions } = await db
  .from("us_completions")
  .select("id", { count: "exact", head: true });
await db.from("us_completions").delete().neq("id", 0);
console.log(`Completions deleted: ${hadCompletions ?? 0}`);

// 2. Release every team.
await db
  .from("us_teams")
  .update({
    gamemaster_id: null,
    claimed_at: null,
    booster_id: null,
    booster_drawn_at: null,
  })
  .not("gamemaster_id", "is", null);

// The trigger only recomputes a team when its completions change, and the
// deletes above did fire it — but a team whose rows were already gone keeps a
// stale cache, so this settles them all explicitly.
await db.from("us_teams").update({ cached_points: 0, cached_completions: 0 }).neq("id", 0);
console.log("Teams released and zeroed.");

// 3. Drop anything added during testing.
const { data: extraStations } = await db
  .from("us_stations")
  .select("id, name")
  .not("name", "in", `(${SEED_STATIONS.map((n) => `"${n}"`).join(",")})`);

for (const station of extraStations ?? []) {
  const { error } = await db.from("us_stations").delete().eq("id", station.id);
  console.log(`  removed station "${station.name}"${error ? ` — FAILED: ${error.message}` : ""}`);
}

const { data: extraTeams } = await db
  .from("us_teams")
  .select("id, name")
  .not("slug", "in", `(${SEED_TEAMS.join(",")})`);

for (const team of extraTeams ?? []) {
  const { error } = await db.from("us_teams").delete().eq("id", team.id);
  console.log(`  removed team "${team.name}"${error ? ` — FAILED: ${error.message}` : ""}`);
}

if ((extraStations?.length ?? 0) + (extraTeams?.length ?? 0) === 0) {
  console.log("No stray stations or teams to remove.");
}

// 4. Report extra accounts rather than deleting them.
const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
const { data: profiles } = await db.from("us_profiles").select("user_id, role, display_name");
const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
const extraPeople = (profiles ?? []).filter((p) => !SEED_EMAILS.includes(emailById.get(p.user_id)));

if (extraPeople.length > 0) {
  console.log("\nExtra Urban Sprint accounts (left in place — delete from /urban-sprint/admin/users):");
  for (const p of extraPeople) {
    console.log(`  ${emailById.get(p.user_id)} (${p.role}) — ${p.display_name}`);
  }
}

/* ------------------------------- Final state ------------------------------ */

const [{ data: teams }, { data: boosters }, { data: stations }, { data: settings }] =
  await Promise.all([
    db.from("us_teams").select("name, gamemaster_id, booster_id, cached_points").order("name"),
    db.from("us_boosters").select("name, bonus_percent, active, us_categories(name)").order("id"),
    db.from("us_stations").select("id", { count: "exact" }).eq("active", true),
    db.from("us_settings").select("event_status, default_base_points, revision").eq("id", 1).maybeSingle(),
  ]);

console.log("\n--- Ready to demo ---");
console.log(`Event status: ${settings.event_status} · default base points: ${Number(settings.default_base_points)}`);

console.log("\nTeams:");
for (const t of teams) {
  const state = t.gamemaster_id ? "CLAIMED" : "open";
  console.log(`  ${t.name.padEnd(15)} ${state.padEnd(8)} booster:${t.booster_id ?? "-"} pts:${Number(t.cached_points)}`);
}

console.log("\nBoosters:");
for (const b of boosters) {
  console.log(`  ${b.name.padEnd(16)} ${b.us_categories.name.padEnd(18)} +${Number(b.bonus_percent)}%${b.active ? "" : "  (inactive)"}`);
}

console.log(`\nActive stations: ${stations.length}`);
console.log("\nSign in at /urban-sprint/login — password: sprint2026");
console.log("  control@urbansprint.test   admin");
console.log("  gm1@urbansprint.test       gamemaster");
console.log("  player1@urbansprint.test   participant (Night Owls)");
