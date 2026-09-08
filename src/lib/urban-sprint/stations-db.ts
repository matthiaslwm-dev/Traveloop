import { getSupabase } from "@/lib/supabase";
import { scoreStation } from "./scoring";
import { getSettings } from "./settings-db";
import type { Booster, Station, StationForTeam } from "./types";

/** Stations are the participating shops a team visits. */

type Row = {
  id: number;
  name: string;
  business_name: string;
  category_id: number;
  address: string;
  instructions: string;
  base_points: number | string;
  active: boolean;
  created_at: string;
  us_categories: { name: string; color: string } | null;
};

const SELECT =
  "id, name, business_name, category_id, address, instructions, base_points, active, created_at, us_categories(name, color)";

function toStation(row: Row): Station {
  return {
    id: row.id,
    name: row.name,
    businessName: row.business_name,
    categoryId: row.category_id,
    categoryName: row.us_categories?.name ?? "",
    categoryColor: row.us_categories?.color ?? "#7c5cff",
    address: row.address,
    instructions: row.instructions,
    basePoints: Number(row.base_points),
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function listStations(options: { activeOnly?: boolean } = {}): Promise<Station[]> {
  let query = getSupabase().from("us_stations").select(SELECT).order("name");
  if (options.activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toStation);
}

export async function getStation(id: number): Promise<Station | null> {
  const { data, error } = await getSupabase()
    .from("us_stations")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toStation(data as unknown as Row) : null;
}

/**
 * The gamemaster's station list: every active station, priced for this team
 * with its booster, and flagged with what they've already done.
 *
 * The projected score is computed here on the server from the same
 * scoreStation() the award uses, so the "you'll get 37.5" on the card and the
 * ledger row written on confirmation come from one calculation.
 */
export async function listStationsForTeam(
  teamId: number,
  booster: Booster | null
): Promise<StationForTeam[]> {
  const db = getSupabase();

  const [stations, completions] = await Promise.all([
    listStations({ activeOnly: true }),
    db
      .from("us_completions")
      .select("station_id, created_at")
      .eq("team_id", teamId)
      .eq("status", "valid"),
  ]);

  const completedAt = new Map<number, string>();
  for (const row of completions.data ?? []) {
    completedAt.set(row.station_id as number, row.created_at as string);
  }

  return stations.map((station) => ({
    ...station,
    completed: completedAt.has(station.id),
    completedAt: completedAt.get(station.id) ?? null,
    projected: scoreStation(station, booster),
  }));
}

export async function createStation(input: {
  name: string;
  businessName: string;
  categoryId: number;
  address: string;
  instructions: string;
  /** Omitted by the gamemaster's quick-add form, which takes the campaign default. */
  basePoints?: number;
  active: boolean;
  createdBy: string;
}): Promise<void> {
  const basePoints =
    input.basePoints ?? (await getSettings()).defaultBasePoints;

  const { error } = await getSupabase().from("us_stations").insert({
    name: input.name,
    business_name: input.businessName,
    category_id: input.categoryId,
    address: input.address,
    instructions: input.instructions,
    base_points: basePoints,
    active: input.active,
    created_by: input.createdBy,
  });

  if (error) throw new Error(error.message);
}

export async function updateStation(
  id: number,
  patch: {
    name?: string;
    businessName?: string;
    categoryId?: number;
    address?: string;
    instructions?: string;
    basePoints?: number;
    active?: boolean;
  }
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.businessName !== undefined) row.business_name = patch.businessName;
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.instructions !== undefined) row.instructions = patch.instructions;
  if (patch.basePoints !== undefined) row.base_points = patch.basePoints;
  if (patch.active !== undefined) row.active = patch.active;

  const { error } = await getSupabase().from("us_stations").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Completions reference stations `on delete restrict`, so a station any team
 * has scored can't be deleted — the ledger would lose the row it points at.
 * Deactivating takes it out of play while keeping the history readable.
 */
export async function deleteStation(id: number): Promise<void> {
  const { error } = await getSupabase().from("us_stations").delete().eq("id", id);
  if (error) {
    throw new Error(
      error.code === "23503"
        ? "A team has already completed that station. Deactivate it instead."
        : error.message
    );
  }
}
