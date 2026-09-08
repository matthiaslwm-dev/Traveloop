import { getSupabase } from "@/lib/supabase";
import type { UrbanSprintRole, UrbanSprintUser } from "./types";

/**
 * Urban Sprint accounts.
 *
 * An account is a Supabase Auth user plus a us_profiles row. The Auth user is
 * shared plumbing; the profile is what makes it an Urban Sprint account, and
 * deleting the profile revokes Urban Sprint access without touching anything
 * else the person might have. Creating one here never grants any Traveloop
 * permission — the Traveloop console is gated on ADMIN_LOGIN_EMAIL, which no
 * account created here can match.
 */

type Membership = { team_id: number; us_teams: { name: string } | null };
type RunningTeam = { id: number; name: string };

type ProfileRow = {
  user_id: string;
  role: string;
  display_name: string;
  phone: string | null;
  active: boolean;
  created_at: string;
  // Both embeds are at most one row per person — membership because user_id is
  // the primary key of us_team_members, and the running team because of the
  // one-team-per-gamemaster index. Whether PostgREST serialises a to-one
  // relationship as an object or a single-element array depends on how it
  // reads the constraints, so both shapes are accepted rather than guessed at.
  us_team_members: Membership | Membership[] | null;
  running: RunningTeam | RunningTeam[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const SELECT = `user_id, role, display_name, phone, active, created_at,
  us_team_members(team_id, us_teams(name)),
  running:us_teams!us_teams_gamemaster_id_fkey(id, name)`;

/**
 * Emails live in auth.users, which PostgREST can't join to, so they're fetched
 * separately and stitched in. One listUsers() call rather than one per row.
 */
async function emailsById(): Promise<Map<string, string>> {
  const { data, error } = await getSupabase().auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const map = new Map<string, string>();
  if (error || !data) return map;
  for (const user of data.users) map.set(user.id, user.email ?? "");
  return map;
}

export async function listUrbanSprintUsers(): Promise<UrbanSprintUser[]> {
  const [{ data, error }, emails] = await Promise.all([
    getSupabase().from("us_profiles").select(SELECT).order("created_at", { ascending: false }),
    emailsById(),
  ]);

  if (error) throw new Error(error.message);

  return (data as unknown as ProfileRow[]).map((row) => {
    // A gamemaster's team is the one they claimed; a participant's is the one
    // they were assigned to. Both surface in the same column in the admin
    // table, so they're resolved to a single pair here.
    const running = one(row.running);
    const member = one(row.us_team_members);

    return {
      userId: row.user_id,
      email: emails.get(row.user_id) ?? "",
      role: row.role as UrbanSprintRole,
      displayName: row.display_name,
      phone: row.phone,
      active: row.active,
      createdAt: row.created_at,
      teamId: running?.id ?? member?.team_id ?? null,
      teamName: running?.name ?? member?.us_teams?.name ?? null,
    };
  });
}

export async function countUsersByRole(): Promise<Record<UrbanSprintRole, number>> {
  const { data } = await getSupabase().from("us_profiles").select("role").eq("active", true);

  const counts: Record<UrbanSprintRole, number> = {
    admin: 0,
    gamemaster: 0,
    participant: 0,
  };

  for (const row of data ?? []) {
    const role = row.role as UrbanSprintRole;
    if (role in counts) counts[role] += 1;
  }

  return counts;
}

export type CreateUserResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Creates the Auth account and the profile together. If the profile insert
 * fails the Auth user is deleted again, so a half-made account can't linger as
 * a login that reaches nothing.
 */
export async function createUrbanSprintUser(input: {
  email: string;
  password: string;
  role: UrbanSprintRole;
  displayName: string;
  phone: string | null;
}): Promise<CreateUserResult> {
  const db = getSupabase();

  const { data, error } = await db.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message.includes("already")
        ? "An account with that email already exists."
        : (error?.message ?? "Could not create that account."),
    };
  }

  const { error: profileError } = await db.from("us_profiles").insert({
    user_id: data.user.id,
    role: input.role,
    display_name: input.displayName,
    phone: input.phone,
  });

  if (profileError) {
    await db.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: profileError.message };
  }

  return { ok: true, userId: data.user.id };
}

export async function updateUrbanSprintUser(
  userId: string,
  patch: {
    role?: UrbanSprintRole;
    displayName?: string;
    phone?: string | null;
    active?: boolean;
  }
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.active !== undefined) row.active = patch.active;

  const db = getSupabase();
  const { error } = await db.from("us_profiles").update(row).eq("user_id", userId);
  if (error) throw new Error(error.message);

  // Changing role away from gamemaster must not leave them still holding a
  // team — the team would be unrunnable and invisible in the available list.
  if (patch.role !== undefined && patch.role !== "gamemaster") {
    await db.from("us_teams").update({ gamemaster_id: null, claimed_at: null }).eq("gamemaster_id", userId);
  }

  // Likewise a non-participant should not sit on a team roster.
  if (patch.role !== undefined && patch.role !== "participant") {
    await db.from("us_team_members").delete().eq("user_id", userId);
  }
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
}

/**
 * Removes the Auth account, which cascades to the profile and from there to
 * team membership. Completions keep their row — gamemaster_id is set null —
 * so deleting a person never rewrites the score history they created.
 */
export async function deleteUrbanSprintUser(userId: string): Promise<void> {
  const { error } = await getSupabase().auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

export async function getUrbanSprintUser(userId: string): Promise<UrbanSprintUser | null> {
  const users = await listUrbanSprintUsers();
  return users.find((user) => user.userId === userId) ?? null;
}
