import { getSupabase } from "@/lib/supabase";

export type CampaignStats = {
  teams: number;
  stations: number;
  completions: number;
  pointsAwarded: number;
  gamemastersOnCourse: number;
};

/**
 * Headline numbers for the public landing page and the admin overview.
 *
 * Every count is a head-only query except the points total, which sums the
 * cached team totals rather than the ledger — the cache is trigger-maintained
 * from that same ledger, so it agrees, and summing a dozen team rows beats
 * scanning every completion on a page anyone can load.
 */
export async function getCampaignStats(): Promise<CampaignStats> {
  const db = getSupabase();

  try {
    const [teams, stations, completions, points, claimed] = await Promise.all([
      db.from("us_teams").select("id", { count: "exact", head: true }).eq("active", true),
      db.from("us_stations").select("id", { count: "exact", head: true }).eq("active", true),
      db
        .from("us_completions")
        .select("id", { count: "exact", head: true })
        .eq("status", "valid"),
      db.from("us_teams").select("cached_points").eq("active", true),
      db
        .from("us_teams")
        .select("id", { count: "exact", head: true })
        .not("gamemaster_id", "is", null),
    ]);

    const pointsAwarded = (points.data ?? []).reduce(
      (total, row) => total + Number(row.cached_points),
      0
    );

    return {
      teams: teams.count ?? 0,
      stations: stations.count ?? 0,
      completions: completions.count ?? 0,
      pointsAwarded,
      gamemastersOnCourse: claimed.count ?? 0,
    };
  } catch {
    // Public page: zeros beat a 500 if the schema isn't installed yet.
    return {
      teams: 0,
      stations: 0,
      completions: 0,
      pointsAwarded: 0,
      gamemastersOnCourse: 0,
    };
  }
}
