import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";
import type { UrbanSprintRole } from "./types";

/**
 * Urban Sprint's authorisation gate.
 *
 * Supabase Auth is shared with the rest of Traveloop, so "has a session" says
 * nothing about Urban Sprint access. What grants it is a row in us_profiles —
 * a Traveloop customer signing in with their shop account gets `null` here,
 * and an Urban Sprint admin is *not* the Traveloop operator, because that
 * check (lib/admin-auth.ts) matches ADMIN_LOGIN_EMAIL and no Urban Sprint role
 * can satisfy it. Neither side inherits the other's permissions.
 *
 * proxy.ts only checks that a session exists before letting a request reach an
 * Urban Sprint page — the role decision is made here, in the layout or action
 * that actually serves the data, per the Next.js guidance that proxy is for
 * optimistic checks rather than authorisation.
 */

export type UrbanSprintSession = {
  userId: string;
  email: string;
  role: UrbanSprintRole;
  displayName: string;
};

export const ROLE_HOME: Record<UrbanSprintRole, string> = {
  admin: "/urban-sprint/admin",
  gamemaster: "/urban-sprint/gamemaster",
  participant: "/urban-sprint/team",
};

export const ROLE_LABEL: Record<UrbanSprintRole, string> = {
  admin: "Administrator",
  gamemaster: "Gamemaster",
  participant: "Participant",
};

/** The signed-in Urban Sprint user, or null for a visitor or an outsider. */
export async function getUrbanSprintSession(): Promise<UrbanSprintSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await getSupabase()
    .from("us_profiles")
    .select("role, display_name, active")
    .eq("user_id", user.id)
    .maybeSingle();

  // A suspended profile is treated exactly like no profile: the account keeps
  // existing (its completions still reference it) but it cannot play.
  if (!profile || !profile.active) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile.role as UrbanSprintRole,
    displayName: profile.display_name || (user.email ?? "").split("@")[0],
  };
}

/** Sends anyone without an Urban Sprint account back to the campaign login. */
export async function requireUrbanSprintSession(): Promise<UrbanSprintSession> {
  const session = await getUrbanSprintSession();
  if (!session) redirect("/urban-sprint/login");
  return session;
}

/**
 * Gate a page or Server Action on a specific role. A signed-in user with the
 * wrong role is bounced to their own home rather than the login screen —
 * being logged in is not the problem, so asking them to log in again wouldn't
 * help.
 */
export async function requireRole(role: UrbanSprintRole): Promise<UrbanSprintSession> {
  const session = await requireUrbanSprintSession();
  if (session.role !== role) redirect(ROLE_HOME[session.role]);
  return session;
}

/**
 * For Server Actions an admin and the acting role may both legitimately call.
 * Server Actions accept direct POSTs, so every one of them re-checks here
 * rather than trusting that the page which rendered the form did.
 */
export async function requireAnyRole(
  ...roles: UrbanSprintRole[]
): Promise<UrbanSprintSession> {
  const session = await requireUrbanSprintSession();
  if (!roles.includes(session.role)) redirect(ROLE_HOME[session.role]);
  return session;
}
