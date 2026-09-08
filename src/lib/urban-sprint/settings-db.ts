import { getSupabase } from "@/lib/supabase";
import type { EventStatus, Settings } from "./types";

const FALLBACK: Settings = {
  eventName: "Urban Sprint",
  eventTagline: "One city. Every shop. Ninety minutes on the clock.",
  eventStatus: "upcoming",
  eventStartsAt: null,
  eventLocation: "George Town, Penang",
  defaultBasePoints: 30,
  revision: 0,
};

/**
 * The singleton settings row. Falls back to sane defaults rather than throwing
 * so the *public* landing page still renders if the table hasn't been created
 * yet — a marketing page that 500s is worse than one showing "upcoming".
 */
export async function getSettings(): Promise<Settings> {
  const { data, error } = await getSupabase()
    .from("us_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return FALLBACK;

  return {
    eventName: data.event_name,
    eventTagline: data.event_tagline,
    eventStatus: data.event_status as EventStatus,
    eventStartsAt: data.event_starts_at,
    eventLocation: data.event_location,
    defaultBasePoints: Number(data.default_base_points),
    revision: Number(data.revision),
  };
}

/**
 * The live-update cursor on its own. Deliberately the narrowest possible
 * query — /urban-sprint/api/pulse runs it on every open tab every few seconds,
 * so it reads one column of one row by primary key.
 */
export async function getRevision(): Promise<number> {
  const { data } = await getSupabase()
    .from("us_settings")
    .select("revision")
    .eq("id", 1)
    .maybeSingle();

  return Number(data?.revision ?? 0);
}

export async function updateSettings(patch: {
  eventName?: string;
  eventTagline?: string;
  eventStatus?: EventStatus;
  eventStartsAt?: string | null;
  eventLocation?: string;
  defaultBasePoints?: number;
}): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.eventName !== undefined) row.event_name = patch.eventName;
  if (patch.eventTagline !== undefined) row.event_tagline = patch.eventTagline;
  if (patch.eventStatus !== undefined) row.event_status = patch.eventStatus;
  if (patch.eventStartsAt !== undefined) row.event_starts_at = patch.eventStartsAt;
  if (patch.eventLocation !== undefined) row.event_location = patch.eventLocation;
  if (patch.defaultBasePoints !== undefined) {
    row.default_base_points = patch.defaultBasePoints;
  }

  // us_settings is where `revision` itself lives, so it can't carry a
  // bump-the-revision trigger without recursing — the write does it inline.
  // Two admins saving at once can collide on the read-then-write, which costs
  // at most one missed refresh tick; the next change corrects it.
  row.revision = (await getRevision()) + 1;

  const { error } = await getSupabase().from("us_settings").update(row).eq("id", 1);
  if (error) throw new Error(error.message);
}
