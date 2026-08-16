import { randomBytes } from "crypto";
import { getSupabase } from "./supabase";
import { findUserIdByEmail, backfillOrdersForEmail } from "./orders-db";

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

export type CustomerAccountResult =
  | { userId: string; isNew: false }
  | { userId: string; isNew: true; password: string }
  | { userId: null; isNew: false };

/**
 * Finds the Supabase Auth account already linked to a previous order for
 * this email, or creates one (with an auto-generated password) on the
 * buyer's first purchase. Newly created accounts get any older, unlinked
 * orders for the same email backfilled onto them.
 */
export async function findOrCreateCustomerAccount(
  email: string,
  name: string | null
): Promise<CustomerAccountResult> {
  const existingUserId = await findUserIdByEmail(email);
  if (existingUserId) {
    return { userId: existingUserId, isNew: false };
  }

  const password = generatePassword();
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });

  if (error || !data.user) {
    // Most likely a race: two near-simultaneous first purchases for the same
    // email both missed the findUserIdByEmail lookup above. Rare enough not
    // to retry — the next purchase for this email will find and reuse the
    // winner's account via findUserIdByEmail.
    console.error(`[customer-account] Failed to create account for ${email}:`, error);
    return { userId: null, isNew: false };
  }

  await backfillOrdersForEmail(email, data.user.id);

  return { userId: data.user.id, isNew: true, password };
}
