import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service-role key, which bypasses RLS.
 * The orders table has no anon-accessible policies, so this key must never
 * reach the browser — server-only code (API routes, server components) only.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cached;
}
