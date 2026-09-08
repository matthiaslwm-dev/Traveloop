import { getSupabase } from "@/lib/supabase";
import { slugify } from "./format";
import type { Category } from "./types";

/**
 * Categories are the vocabulary shared by Stations and Boosters — a booster
 * matches a station when their category ids are equal, so this table is what
 * makes the bonus rule work. Nothing here is seeded in code: the campaign
 * decides its own categories (see supabase/seed-urban-sprint.mjs for a
 * starting set an operator can keep or replace).
 */

type Row = {
  id: number;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
};

function toCategory(row: Row): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await getSupabase()
    .from("us_categories")
    .select("id, name, slug, color, sort_order")
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map(toCategory);
}

export async function createCategory(input: {
  name: string;
  color: string;
  sortOrder: number;
}): Promise<void> {
  const { error } = await getSupabase().from("us_categories").insert({
    name: input.name,
    slug: slugify(input.name),
    color: input.color,
    sort_order: input.sortOrder,
  });

  if (error) throw new Error(errorMessage(error.message));
}

export async function updateCategory(
  id: number,
  patch: { name?: string; color?: string; sortOrder?: number }
): Promise<void> {
  const row: Record<string, unknown> = {};
  // The slug deliberately does not follow a rename: stations and boosters
  // reference the id, and keeping the slug stable means any URL or export that
  // captured it stays valid.
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.color !== undefined) row.color = patch.color;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;

  const { error } = await getSupabase().from("us_categories").update(row).eq("id", id);
  if (error) throw new Error(errorMessage(error.message));
}

/**
 * Deletion is `on delete restrict` from both stations and boosters, so a
 * category still in use fails at the database rather than orphaning rows.
 */
export async function deleteCategory(id: number): Promise<void> {
  const { error } = await getSupabase().from("us_categories").delete().eq("id", id);
  if (error) {
    throw new Error(
      error.code === "23503"
        ? "That category is still used by a station or booster."
        : errorMessage(error.message)
    );
  }
}

function errorMessage(message: string): string {
  if (message.includes("us_categories_slug_key")) {
    return "A category with that name already exists.";
  }
  return message;
}
