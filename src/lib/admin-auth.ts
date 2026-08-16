import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Customers have their own Supabase Auth accounts, so a signed-in session
 * alone doesn't mean admin — the session's email must match the one
 * ADMIN_LOGIN_EMAIL signs in as. proxy.ts checks this for page navigation;
 * call this too from Server Actions, which accept direct POSTs and skip it.
 *
 * Pass an already-fetched `user` when the caller needs it for other checks
 * too, so this doesn't issue a redundant `getUser()` call.
 */
export async function isAdminUser(
  supabase: SupabaseClient,
  user?: User | null
): Promise<boolean> {
  const resolvedUser =
    user !== undefined
      ? user
      : (
          await supabase.auth.getUser()
        ).data.user;

  return Boolean(resolvedUser && resolvedUser.email === process.env.ADMIN_LOGIN_EMAIL);
}
