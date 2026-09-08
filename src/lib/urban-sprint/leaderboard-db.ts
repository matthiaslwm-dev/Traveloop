import { getSupabase } from "@/lib/supabase";
import type { LeaderboardRow } from "./types";

/**
 * Reads the us_leaderboard view, where the ranking is computed by a SQL window
 * function. Every surface — the public board, the gamemaster's rank chip, the
 * admin table — comes through here, so they cannot disagree about who is 3rd.
 */

type Row = {
  id: number;
  name: string;
  slug: string;
  color: string;
  points: number | string;
  stations_completed: number;
  booster_name: string | null;
  booster_category: string | null;
  booster_category_color: string | null;
  bonus_percent: number | string | null;
  rank: number | string;
};

function toRow(row: Row): LeaderboardRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    points: Number(row.points),
    stationsCompleted: row.stations_completed,
    boosterName: row.booster_name,
    boosterCategory: row.booster_category,
    boosterCategoryColor: row.booster_category_color,
    bonusPercent: row.bonus_percent === null ? null : Number(row.bonus_percent),
    rank: Number(row.rank),
  };
}

export async function getLeaderboard(limit?: number): Promise<LeaderboardRow[]> {
  let query = getSupabase()
    .from("us_leaderboard")
    .select("*")
    .order("rank")
    .order("name");

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  // The public landing page renders this; an empty board is a better failure
  // than a 500 on a marketing URL.
  if (error) return [];
  return (data as unknown as Row[]).map(toRow);
}

/** The single row for one team — used for "you're 3rd of 12" chips. */
export async function getLeaderboardEntry(teamId: number): Promise<LeaderboardRow | null> {
  const board = await getLeaderboard();
  return board.find((row) => row.id === teamId) ?? null;
}

/**
 * Rank plus field size in one read, so a team's standing can be phrased as
 * "3rd of 12" rather than a bare number.
 */
export async function getStanding(
  teamId: number
): Promise<{ rank: number | null; teams: number }> {
  const board = await getLeaderboard();
  return {
    rank: board.find((row) => row.id === teamId)?.rank ?? null,
    teams: board.length,
  };
}
