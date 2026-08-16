import { getSupabase } from "./supabase";
import type { PassRegistration } from "./registration";

/** One pass in a cart, before payment. */
export type DraftItem = {
  passKey: string;
  passName: string;
  unitAmountCents: number;
  registration: PassRegistration;
};

type DraftRow = {
  id: string;
  items: DraftItem[];
};

/** Stores a cart's items and returns the draft id to carry through Stripe metadata. */
export async function insertCheckoutDraft(items: DraftItem[]): Promise<string> {
  const db = getSupabase();

  const { data, error } = await db
    .from("checkout_drafts")
    .insert({ items })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(`Failed to save checkout draft: ${error?.message}`);
  }

  return data.id;
}

export async function getCheckoutDraft(id: string): Promise<DraftItem[] | null> {
  const db = getSupabase();

  const { data, error } = await db
    .from("checkout_drafts")
    .select("id, items")
    .eq("id", id)
    .maybeSingle<DraftRow>();

  if (error) {
    throw new Error(`Failed to load checkout draft ${id}: ${error.message}`);
  }

  return data?.items ?? null;
}

/** Best-effort cleanup once a draft has been turned into an order — never blocks fulfilment. */
export async function deleteCheckoutDraft(id: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db.from("checkout_drafts").delete().eq("id", id);

  if (error) {
    console.error(`[checkout-drafts] Failed to delete draft ${id}:`, error.message);
  }
}
