import { getSupabase } from "@/lib/supabase";
import type { Booster } from "./types";

/**
 * Boosters pair a category with the bonus percentage a team earns on stations
 * in it. The percentage lives on the row — there is no default constant in the
 * scoring code — so "+25%" this weekend and "+40%" next is a data change.
 */

type Row = {
  id: number;
  name: string;
  category_id: number;
  bonus_percent: number | string;
  description: string;
  active: boolean;
  us_categories: { name: string; color: string } | null;
};

const SELECT = "id, name, category_id, bonus_percent, description, active, us_categories(name, color)";

export function toBooster(row: Row): Booster {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.us_categories?.name ?? "",
    categoryColor: row.us_categories?.color ?? "#7c5cff",
    bonusPercent: Number(row.bonus_percent),
    description: row.description,
    active: row.active,
  };
}

export async function listBoosters(options: { activeOnly?: boolean } = {}): Promise<Booster[]> {
  let query = getSupabase().from("us_boosters").select(SELECT).order("name");
  if (options.activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toBooster);
}

export async function createBooster(input: {
  name: string;
  categoryId: number;
  bonusPercent: number;
  description: string;
  active: boolean;
}): Promise<void> {
  const { error } = await getSupabase().from("us_boosters").insert({
    name: input.name,
    category_id: input.categoryId,
    bonus_percent: input.bonusPercent,
    description: input.description,
    active: input.active,
  });

  if (error) throw new Error(error.message);
}

export async function updateBooster(
  id: number,
  patch: {
    name?: string;
    categoryId?: number;
    bonusPercent?: number;
    description?: string;
    active?: boolean;
  }
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
  if (patch.bonusPercent !== undefined) row.bonus_percent = patch.bonusPercent;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.active !== undefined) row.active = patch.active;

  const { error } = await getSupabase().from("us_boosters").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Teams reference their drawn booster, so deleting one that's in play would
 * either fail or null out a team's booster mid-game. Editing a booster changes
 * future awards only — completions snapshot the percentage they were scored
 * with — but a team's *current* booster is live data, so an in-play booster
 * has to be deactivated rather than deleted.
 */
export async function deleteBooster(id: number): Promise<void> {
  const db = getSupabase();

  const { count } = await db
    .from("us_teams")
    .select("id", { count: "exact", head: true })
    .eq("booster_id", id);

  if ((count ?? 0) > 0) {
    throw new Error(
      "A team has already drawn that booster. Deactivate it instead — it will stop appearing in draws."
    );
  }

  const { error } = await db.from("us_boosters").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
