import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBookingByReference } from "@/lib/experience-bookings-db";
import { formatPrice, sessionInstant } from "@/app/data/experiences";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ reference: string }> };

/** "20260819T120000Z" — the basic-format UTC stamp iCalendar wants. */
function icsStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

/** Commas, semicolons, backslashes and newlines are structural in iCalendar text values. */
function icsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Downloads a confirmed booking as a calendar invite.
 *
 * Session times are Malaysian wall-clock; they're converted to UTC instants so
 * the event lands at the right local time in whatever calendar the traveller
 * uses, wherever they happen to be when they add it.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { reference } = await params;
  const booking = await getBookingByReference(reference);

  // Same 404 for "doesn't exist" and "isn't yours" — a reference shouldn't be
  // probeable for existence.
  if (!booking || booking.userId !== user.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const description = [
    `Booking reference: ${booking.reference}`,
    `Participants: ${booking.participants}${
      booking.childrenCount > 0 ? ` + ${booking.childrenCount} child (free)` : ""
    }`,
    `Payable at the venue: ${formatPrice(booking.quotedAmountCents)}`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Traveloop//Experience Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.reference}@traveloop`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(sessionInstant(booking.sessionDate, booking.startMinutes))}`,
    `DTEND:${icsStamp(sessionInstant(booking.sessionDate, booking.endMinutes))}`,
    `SUMMARY:${icsText(`Traveloop — ${booking.experienceName}`)}`,
    `LOCATION:${icsText(booking.location ?? "To be advised")}`,
    `DESCRIPTION:${icsText(description)}`,
    `STATUS:${booking.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${booking.reference}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
