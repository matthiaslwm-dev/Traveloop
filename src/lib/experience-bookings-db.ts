import { getSupabase } from "./supabase";
import { fromTimeString, slotValue, toTimeString, type BookingWindow } from "@/app/data/experiences";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (BOOKING_STATUSES as string[]).includes(value);
}

export type StoredBooking = {
  id: number;
  /** "TLX-2026-0001" — what the customer quotes when they contact us. */
  reference: string;
  userId: string;
  /** The order (and therefore the pass) this booking was made against. */
  orderSessionId: string;
  passKey: string;
  experienceKey: string;
  experienceName: string;
  /** "2026-08-19", Malaysian local date. */
  sessionDate: string;
  /** Minutes past midnight, Malaysian local time. */
  startMinutes: number;
  endMinutes: number;
  participants: number;
  childrenCount: number;
  packageKey: string | null;
  location: string | null;
  quotedAmountCents: number;
  currency: string;
  discountPercent: number;
  status: BookingStatus;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  cancelledAt: string | null;
};

/** The fields a caller supplies; everything else is derived or defaulted. */
export type NewBooking = Omit<
  StoredBooking,
  "id" | "reference" | "status" | "createdAt" | "cancelledAt" | "adminNotes"
>;

type BookingRow = {
  id: number;
  reference: string;
  user_id: string;
  order_session_id: string;
  pass_key: string;
  experience_key: string;
  experience_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  participants: number;
  children_count: number;
  package_key: string | null;
  location: string | null;
  quoted_amount_cents: number;
  currency: string;
  discount_percent: number;
  status: BookingStatus;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  cancelled_at: string | null;
};

function toStoredBooking(row: BookingRow): StoredBooking {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    orderSessionId: row.order_session_id,
    passKey: row.pass_key,
    experienceKey: row.experience_key,
    experienceName: row.experience_name,
    sessionDate: row.session_date,
    startMinutes: fromTimeString(row.start_time),
    endMinutes: fromTimeString(row.end_time),
    participants: row.participants,
    childrenCount: row.children_count,
    packageKey: row.package_key,
    location: row.location,
    quotedAmountCents: row.quoted_amount_cents,
    currency: row.currency,
    discountPercent: row.discount_percent,
    status: row.status,
    customerNotes: row.customer_notes,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
  };
}

/** "TLX-2026-0001" — sequential per calendar year, mirroring invoice numbers. */
function referenceFor(rowId: number): string {
  return `TLX-${new Date().getFullYear()}-${String(rowId).padStart(4, "0")}`;
}

/** Raised when the partial unique index rejects a second active booking for the same experience. */
export class DuplicateBookingError extends Error {
  constructor() {
    super("You already have a booking for this experience.");
    this.name = "DuplicateBookingError";
  }
}

/** Raised by the capacity trigger when a session's 20 spots are already taken. */
export class SlotFullError extends Error {
  constructor() {
    super("That session is fully booked.");
    this.name = "SlotFullError";
  }
}

const UNIQUE_VIOLATION = "23505";
/** Default SQLSTATE for a plpgsql `raise exception` — only the capacity trigger uses it here. */
const RAISED_EXCEPTION = "P0001";

export async function insertBooking(booking: NewBooking): Promise<StoredBooking> {
  const db = getSupabase();

  // Reference is filled in on a second write, once the row id exists — the
  // unique index skips empty references so this intermediate state is legal.
  const { data: inserted, error: insertError } = await db
    .from("experience_bookings")
    .insert({
      user_id: booking.userId,
      order_session_id: booking.orderSessionId,
      pass_key: booking.passKey,
      experience_key: booking.experienceKey,
      experience_name: booking.experienceName,
      session_date: booking.sessionDate,
      start_time: toTimeString(booking.startMinutes),
      end_time: toTimeString(booking.endMinutes),
      participants: booking.participants,
      children_count: booking.childrenCount,
      package_key: booking.packageKey,
      location: booking.location,
      quoted_amount_cents: booking.quotedAmountCents,
      currency: booking.currency,
      discount_percent: booking.discountPercent,
      customer_notes: booking.customerNotes,
      reference: "",
    })
    .select()
    .single<BookingRow>();

  if (insertError || !inserted) {
    if (insertError?.code === UNIQUE_VIOLATION) throw new DuplicateBookingError();
    if (insertError?.code === RAISED_EXCEPTION) throw new SlotFullError();
    throw new Error(`Failed to create booking: ${insertError?.message}`);
  }

  const { data: updated, error: updateError } = await db
    .from("experience_bookings")
    .update({ reference: referenceFor(inserted.id) })
    .eq("id", inserted.id)
    .select()
    .single<BookingRow>();

  if (updateError || !updated) {
    throw new Error(`Failed to set reference for booking ${inserted.id}: ${updateError?.message}`);
  }

  return toStoredBooking(updated);
}

/**
 * Total participants already booked (non-cancelled) per session in the given
 * window, keyed the same way as `slotValue` — lets the booking page show
 * remaining spots and grey out full sessions before the customer even tries.
 */
export async function getSlotBookingCounts(
  experienceKey: string,
  window: BookingWindow
): Promise<Map<string, number>> {
  const db = getSupabase();

  const { data, error } = await db
    .from("experience_bookings")
    .select("session_date, start_time, participants")
    .eq("experience_key", experienceKey)
    .neq("status", "cancelled")
    .gte("session_date", window.earliest)
    .lte("session_date", window.latest);

  if (error) {
    throw new Error(`Failed to count bookings for ${experienceKey}: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = slotValue(row.session_date, fromTimeString(row.start_time));
    counts.set(key, (counts.get(key) ?? 0) + row.participants);
  }
  return counts;
}

/** Whether this customer already has a pending/confirmed booking for this experience. */
export async function hasActiveBookingForExperience(
  userId: string,
  experienceKey: string
): Promise<boolean> {
  const db = getSupabase();

  const { data, error } = await db
    .from("experience_bookings")
    .select("id")
    .eq("user_id", userId)
    .eq("experience_key", experienceKey)
    .neq("status", "cancelled")
    .limit(1);

  if (error) {
    throw new Error(`Failed to check existing bookings for ${experienceKey}: ${error.message}`);
  }

  return (data ?? []).length > 0;
}

/** A customer's bookings, soonest session first — powers the portal list. */
export async function getBookingsByUserId(userId: string): Promise<StoredBooking[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from("experience_bookings")
    .select()
    .eq("user_id", userId)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .returns<BookingRow[]>();

  if (error) {
    throw new Error(`Failed to list bookings for user ${userId}: ${error.message}`);
  }

  return (data ?? []).map(toStoredBooking);
}

export async function getBookingByReference(reference: string): Promise<StoredBooking | null> {
  const db = getSupabase();

  const { data, error } = await db
    .from("experience_bookings")
    .select()
    .eq("reference", reference)
    .maybeSingle<BookingRow>();

  if (error) {
    throw new Error(`Failed to look up booking ${reference}: ${error.message}`);
  }

  return data ? toStoredBooking(data) : null;
}

/** Every booking, soonest session first — the admin view. */
export async function getAllBookings(): Promise<StoredBooking[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from("experience_bookings")
    .select()
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .returns<BookingRow[]>();

  if (error) {
    throw new Error(`Failed to list bookings: ${error.message}`);
  }

  return (data ?? []).map(toStoredBooking);
}

/**
 * Moves a booking to a new status.
 *
 * `expectedUserId` is the ownership guard for the customer-facing cancel
 * action: passing it turns the update into a no-op for anyone else's booking,
 * so an attacker posting someone else's reference changes nothing. Admin
 * callers omit it.
 */
export async function updateBookingStatus(
  reference: string,
  status: BookingStatus,
  options: { expectedUserId?: string; adminNotes?: string | null } = {}
): Promise<StoredBooking | null> {
  const db = getSupabase();

  let query = db
    .from("experience_bookings")
    .update({
      status,
      updated_at: new Date().toISOString(),
      cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
      ...(options.adminNotes === undefined ? {} : { admin_notes: options.adminNotes }),
    })
    .eq("reference", reference);

  if (options.expectedUserId) {
    query = query.eq("user_id", options.expectedUserId);
  }

  const { data, error } = await query.select().maybeSingle<BookingRow>();

  if (error) {
    throw new Error(`Failed to update booking ${reference}: ${error.message}`);
  }

  return data ? toStoredBooking(data) : null;
}
