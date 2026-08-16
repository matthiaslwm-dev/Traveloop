import type { PassKey } from "./passes";

/**
 * The bookable cultural experiences, the weekly sessions they run, and what
 * each pass tier is entitled to.
 *
 * Prices here are the *regular* (undiscounted) amounts in sen. The tier
 * discount in `discountByTier` is applied on top, so the pass-holder price and
 * the "reg." price shown next to it can never drift apart. A tier missing from
 * `discountByTier` is not entitled to the experience at all — that map is the
 * single source of truth for access, and the server re-checks it before any
 * booking is written.
 *
 * Bookings are payment-on-the-day: nothing is charged online, so every amount
 * produced here is a quote the customer settles at the venue.
 */

export type ExperienceKey = "lion-dance" | "batik" | "indian-culture" | "photography";

export const EXPERIENCE_CURRENCY = "MYR";

/** Everything is scheduled in Malaysian local time; the country has no DST. */
export const EXPERIENCE_TIME_ZONE = "Asia/Kuala_Lumpur";

/** A customer must book at least this many days before the session. */
export const BOOKING_LEAD_DAYS = 3;

/** How far ahead the calendar lets a customer look. */
export const BOOKING_WINDOW_DAYS = 60;

/** A booking can be cancelled from the portal until this many hours before it starts. */
export const CANCELLATION_CUTOFF_HOURS = 48;

/** 0 = Sunday … 6 = Saturday, matching Date#getUTCDay. */
export type WeeklySession = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

export type ExperiencePackage = {
  key: string;
  label: string;
  priceCents: number;
  note?: string;
};

export type ExperiencePricing =
  /** One regular price per participant. */
  | { mode: "per-person"; basePerPersonCents: number }
  /**
   * A group package covering up to `includedParticipants` people, with each
   * person beyond that charged `extraPersonCents`.
   *
   * Only the package carries the tier discount. `extraPersonCents` is a flat
   * rate every tier pays — a Silver holder and a Platinum holder are charged
   * the same for a fifth participant.
   */
  | {
      mode: "group";
      baseGroupCents: number;
      minParticipants: number;
      includedParticipants: number;
      extraPersonCents: number;
    }
  /**
   * Fixed packages the customer chooses between. These are already the
   * pass-holder price, so no tier discount is applied on top.
   */
  | { mode: "packages"; options: ExperiencePackage[] };

export type ExperienceLocationOption = {
  value: string;
  label: string;
  comingSoon?: boolean;
};

export type Experience = {
  key: ExperienceKey;
  name: string;
  /** Matches an `Icon` name in app/components/Icons.tsx. */
  icon: string;
  image: string;
  tagline: string;
  description: string;
  /** Bullets shown on the booking page — what the session actually includes. */
  includes: string[];
  durationLabel: string;
  /**
   * Fixed venue, or null when the customer picks from `locationOptions` /
   * the venue is confirmed after booking.
   */
  venue: string | null;
  venueNote?: string;
  locationOptions?: ExperienceLocationOption[];
  /** The fixed weekly sessions this experience runs. */
  sessions: WeeklySession[];
  pricing: ExperiencePricing;
  /** Percentage off the regular price, per tier. Absent tier = no access. */
  discountByTier: Partial<Record<PassKey, number>>;
  participants: { min: number; max: number; label: string };
  /** Children below this age join free and aren't counted as paying participants. */
  freeChildAgeUnder?: number;
  /** Shown on the confirmation step — what the customer should know before turning up. */
  knowBeforeYouGo: string[];
};

const HOUR = 60;

export const experiences: Experience[] = [
  {
    key: "lion-dance",
    name: "Lion Dance Experience",
    icon: "ticket",
    image: "/lion-dance.webp",
    tagline: "Learn the drums, the steps and the lion head.",
    description:
      "A hands-on session with a Penang lion dance troupe: authentic instruments, a traditional lion head, and the basics of the routine taught by performers who compete with it.",
    includes: [
      "Guided introduction to lion dance history and symbolism",
      "Hands-on time with the drum, gong and cymbals",
      "Try the lion head with a partner, under instruction",
      "Photos with the troupe at the end of the session",
    ],
    durationLabel: "2 hours",
    venue: "Penang Island",
    venueNote: "The exact address on Penang Island is confirmed by our team after booking.",
    sessions: [
      { weekday: 2, startMinutes: 20 * HOUR, endMinutes: 22 * HOUR },
      { weekday: 4, startMinutes: 20 * HOUR, endMinutes: 22 * HOUR },
      { weekday: 0, startMinutes: 13 * HOUR, endMinutes: 15 * HOUR },
    ],
    pricing: { mode: "per-person", basePerPersonCents: 80_000 },
    discountByTier: { silver: 25, gold: 50, platinum: 83.75 },
    participants: { min: 2, max: 12, label: "Participants" },
    freeChildAgeUnder: 6,
    knowBeforeYouGo: [
      "Wear comfortable clothing and closed shoes you can move in.",
      "Arrive 15 minutes early — the troupe starts on time.",
      "Children aged 5 and under join free and don't need to be counted below.",
    ],
  },
  {
    key: "batik",
    name: "Batik Painting Experience",
    icon: "landmark",
    image: "/batik.jpg",
    tagline: "Paint a souvenir you actually made yourself.",
    description:
      "Discover the history behind Malaysian batik, then hand-paint your own piece to take home. Museum admission and light refreshments are included.",
    includes: [
      "Museum admission and a guided look at the batik collection",
      "All materials — fabric, wax resist, dyes and brushes",
      "Your finished piece to take home",
      "Light refreshments during the session",
    ],
    durationLabel: "2 hours",
    venue: "Muzium & Galeri Tuanku Fauziah",
    sessions: [{ weekday: 3, startMinutes: 10 * HOUR, endMinutes: 12 * HOUR }],
    pricing: { mode: "per-person", basePerPersonCents: 52_000 },
    discountByTier: { silver: 25, gold: 50, platinum: 75 },
    participants: { min: 1, max: 12, label: "Participants" },
    freeChildAgeUnder: 5,
    knowBeforeYouGo: [
      "Dyes stain — wear something you don't mind marking, or bring an apron.",
      "Your piece needs about 30 minutes to dry before you can take it away.",
      "Children aged 4 and under join free and don't need to be counted below.",
    ],
  },
  {
    key: "indian-culture",
    name: "Indian Culture Experience",
    icon: "users",
    image: "/kolam.png",
    tagline: "Kolam art, a cooking lesson and Bharatanatyam.",
    description:
      "An afternoon at Penang's Mariamman Temple: try your hand at kolam rice-flour art, take a traditional Indian cooking lesson, and watch a Bharatanatyam dance demonstration.",
    includes: [
      "Kolam (rice-flour rangoli) workshop",
      "Traditional Indian cooking lesson",
      "Live Bharatanatyam dance demonstration",
      "Guided introduction to the temple and its history",
    ],
    durationLabel: "2 hours",
    venue: "Mariamman Temple",
    sessions: [{ weekday: 0, startMinutes: 15 * HOUR, endMinutes: 17 * HOUR }],
    pricing: { mode: "per-person", basePerPersonCents: 52_000 },
    discountByTier: { silver: 25, gold: 50, platinum: 75 },
    participants: { min: 1, max: 12, label: "Participants" },
    freeChildAgeUnder: 6,
    knowBeforeYouGo: [
      "The temple is a place of worship — shoulders and knees should be covered.",
      "Shoes are removed at the entrance.",
      "Children aged 5 and under join free and don't need to be counted below.",
    ],
  },
  {
    key: "photography",
    name: "Private Photography Session",
    icon: "camera",
    image:
      "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1000&q=85",
    tagline: "90 minutes with a professional photographer.",
    description:
      "A private shoot around Penang's heritage streets or the Batu Ferringhi coast, with a professional photographer who knows where the light lands. Choose how many edited photos you want to keep.",
    includes: [
      "90-minute private session with a professional photographer",
      "Location scouting and posing direction throughout",
      "Professionally edited, high-resolution digital photos",
      "A highlight reel of the session",
    ],
    durationLabel: "90 minutes",
    venue: null,
    venueNote: "Penang Heritage Zone or hotels in Batu Ferringhi — your photographer meets you there.",
    locationOptions: [
      { value: "Penang Heritage Zone", label: "Penang Heritage Zone" },
      { value: "Hotels in Batu Ferringhi", label: "Hotels in Batu Ferringhi" },
      { value: "Kuala Lumpur", label: "Kuala Lumpur", comingSoon: true },
    ],
    sessions: [
      { weekday: 6, startMinutes: 8 * HOUR + 30, endMinutes: 10 * HOUR },
      { weekday: 6, startMinutes: 10 * HOUR, endMinutes: 11 * HOUR + 30 },
    ],
    pricing: {
      mode: "packages",
      options: [
        { key: "photos-10", label: "10 digital photos", priceCents: 15_000 },
        { key: "photos-20", label: "20 digital photos", priceCents: 25_000 },
        {
          key: "photos-all",
          label: "All digital photos",
          priceCents: 35_000,
          note: "Includes a free Lion Dance Experience for 2 participants",
        },
      ],
    },
    discountByTier: { platinum: 0 },
    participants: { min: 1, max: 8, label: "People in the shoot" },
    knowBeforeYouGo: [
      "Sessions run Saturday mornings only — the light is best before midday.",
      "Edited photos are delivered by download link within 7 working days.",
      "Heritage Zone shoots start from Armenian Street unless we agree otherwise.",
      "Kuala Lumpur locations are coming soon.",
    ],
  },
];

export function isExperienceKey(value: unknown): value is ExperienceKey {
  return experiences.some((experience) => experience.key === value);
}

export function getExperience(key: unknown): Experience | undefined {
  return isExperienceKey(key) ? experiences.find((e) => e.key === key) : undefined;
}

/* ------------------------------------------------------------------ */
/* Entitlement                                                         */
/* ------------------------------------------------------------------ */

export type Entitlement =
  | { entitled: true; discountPercent: number }
  | { entitled: false; discountPercent: 0; upgradeTo: PassKey[] };

/**
 * What a given pass tier unlocks for a given experience.
 *
 * This is the access check the whole feature hangs off: the browse page uses
 * it to lock cards, the booking page to price, and the server action to refuse
 * a booking whose pass doesn't cover it.
 */
export function getEntitlement(passKey: string, experience: Experience): Entitlement {
  const discountPercent = experience.discountByTier[passKey as PassKey];

  if (discountPercent === undefined) {
    return {
      entitled: false,
      discountPercent: 0,
      upgradeTo: Object.keys(experience.discountByTier) as PassKey[],
    };
  }

  return { entitled: true, discountPercent };
}

/** The experiences a pass tier can book, in catalogue order. */
export function experiencesForPass(passKey: string): Experience[] {
  return experiences.filter((e) => getEntitlement(passKey, e).entitled);
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export type QuoteLine = { label: string; amountCents: number };

export type Quote = {
  lines: QuoteLine[];
  /** What the customer pays at the venue. */
  totalCents: number;
  /** What the same booking would cost without a pass. */
  regularTotalCents: number;
  savingsCents: number;
  discountPercent: number;
};

/** 39000 -> "390.00" */
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** 39000 -> "MYR 390.00" */
export function formatPrice(cents: number): string {
  return `${EXPERIENCE_CURRENCY} ${formatAmount(cents)}`;
}

/** Rounds to whole sen so a percentage discount can't produce fractional money. */
function applyDiscount(cents: number, discountPercent: number): number {
  return Math.round(cents * (1 - discountPercent / 100));
}

export type QuoteInput = {
  participants: number;
  /** Only meaningful for `mode: "packages"` experiences. */
  packageKey?: string | null;
};

/**
 * Prices a booking. The browser runs this to preview a total and the server
 * runs it again on submit — the stored amount always comes from the server
 * copy, so a tampered form can't book a MYR 390 workshop for nothing.
 */
export function quoteBooking(
  experience: Experience,
  discountPercent: number,
  input: QuoteInput
): Quote {
  const lines: QuoteLine[] = [];
  let regularTotalCents = 0;

  switch (experience.pricing.mode) {
    case "per-person": {
      const { basePerPersonCents } = experience.pricing;
      regularTotalCents = basePerPersonCents * input.participants;
      lines.push({
        label: `${input.participants} × ${formatPrice(
          applyDiscount(basePerPersonCents, discountPercent)
        )} per person`,
        amountCents: applyDiscount(basePerPersonCents, discountPercent) * input.participants,
      });
      break;
    }

    case "group": {
      const { baseGroupCents, includedParticipants, extraPersonCents } = experience.pricing;
      const extras = Math.max(0, input.participants - includedParticipants);

      // Extras are flat-rated, so they add the same amount to the pass-holder
      // total and to the regular-price comparison — the saving shown is
      // entirely the discount on the package itself.
      regularTotalCents = baseGroupCents + extraPersonCents * extras;

      lines.push({
        label: `Group package (up to ${includedParticipants} participants)`,
        amountCents: applyDiscount(baseGroupCents, discountPercent),
      });

      if (extras > 0) {
        lines.push({
          label: `${extras} additional participant${extras === 1 ? "" : "s"} × ${formatPrice(
            extraPersonCents
          )}`,
          amountCents: extraPersonCents * extras,
        });
      }
      break;
    }

    case "packages": {
      const option =
        experience.pricing.options.find((o) => o.key === input.packageKey) ??
        experience.pricing.options[0];

      // Package prices are already the pass-holder rate, so there is nothing
      // to discount and no "regular" price to strike through.
      regularTotalCents = option.priceCents;
      lines.push({ label: option.label, amountCents: option.priceCents });
      break;
    }
  }

  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);

  return {
    lines,
    totalCents,
    regularTotalCents,
    savingsCents: Math.max(0, regularTotalCents - totalCents),
    discountPercent,
  };
}

/**
 * Prices are deliberately absent from the browse pages: an experience's cost
 * depends on headcount, package and pass tier, so any single figure shown next
 * to a card would either be wrong or need so many caveats it stops being
 * useful. `quoteBooking` on the booking page is the only place a customer sees
 * a price, and it's the real one.
 */

/* ------------------------------------------------------------------ */
/* Scheduling                                                          */
/* ------------------------------------------------------------------ */

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** "8:00 PM" */
export function formatTime(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/** "8:00 PM – 10:00 PM" */
export function formatTimeRange(startMinutes: number, endMinutes: number): string {
  return `${formatTime(startMinutes)} – ${formatTime(endMinutes)}`;
}

/** "HH:MM:SS", the shape Postgres `time` wants. */
export function toTimeString(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(
    2,
    "0"
  )}:00`;
}

/** "20:00:00" -> 1200. Tolerates the "20:00" Postgres sometimes returns. */
export function fromTimeString(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** ["Tue", "Thu", "Sun"] — the days this runs, Monday-first to match the calendar. */
export function scheduleWeekdays(experience: Experience): string[] {
  const weekdays = [...new Set(experience.sessions.map((session) => session.weekday))];
  // (day + 6) % 7 puts Monday at 0 and Sunday at 6.
  weekdays.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return weekdays.map((day) => WEEKDAY_SHORT[day]);
}

/** "Tuesday & Thursday" */
function joinWeekdays(weekdays: number[]): string {
  const names = weekdays.map((day) => WEEKDAY_NAMES[day]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names.at(-1)}` : names[0];
}

/**
 * The recurring-schedule blurb, e.g.
 * "Tuesday & Thursday 8:00 PM – 10:00 PM · Sunday 1:00 PM – 3:00 PM".
 *
 * Days running an identical set of times are collapsed together so a schedule
 * reads the way someone would say it out loud, rather than repeating the same
 * range once per weekday.
 */
export function describeSchedule(experience: Experience): string {
  const timesByWeekday = new Map<number, string[]>();

  for (const session of experience.sessions) {
    const times = timesByWeekday.get(session.weekday) ?? [];
    times.push(formatTimeRange(session.startMinutes, session.endMinutes));
    timesByWeekday.set(session.weekday, times);
  }

  const groups: { weekdays: number[]; times: string }[] = [];

  for (const [weekday, times] of timesByWeekday) {
    const label = times.join(", ");
    const existing = groups.find((group) => group.times === label);
    if (existing) existing.weekdays.push(weekday);
    else groups.push({ weekdays: [weekday], times: label });
  }

  return groups.map((group) => `${joinWeekdays(group.weekdays)} ${group.times}`).join(" · ");
}

/* ---- Calendar-date arithmetic ----
 * Dates are handled as plain "YYYY-MM-DD" strings anchored to UTC midnight, so
 * the server's own timezone can never shift a session onto the wrong day.
 */

export function todayInMalaysia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EXPERIENCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const shifted = parseDate(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return toDateString(shifted);
}

/** "Sun, 9 Aug 2026" */
export function formatDateLong(date: string): string {
  return parseDate(date).toLocaleDateString("en-MY", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * The real instant a Malaysian wall-clock session starts.
 *
 * Malaysia is a fixed UTC+8 with no daylight saving, so the offset can simply
 * be subtracted — no timezone database lookup is needed to get this right.
 */
export function sessionInstant(date: string, minutes: number): Date {
  return new Date(parseDate(date).getTime() + (minutes - 8 * 60) * 60_000);
}

export type BookingWindow = { earliest: string; latest: string };

/**
 * The dates a customer may pick from: the lead-time/horizon rules, narrowed to
 * their trip when we know it — a pass covers a stay, so there's no sense
 * offering sessions the customer won't be in the country for.
 */
export function resolveBookingWindow(
  trip: { arrivalDate: string | null; departureDate: string | null },
  today: string = todayInMalaysia()
): BookingWindow {
  let earliest = addDays(today, BOOKING_LEAD_DAYS);
  let latest = addDays(today, BOOKING_WINDOW_DAYS);

  if (trip.arrivalDate && trip.arrivalDate > earliest) earliest = trip.arrivalDate;
  if (trip.departureDate && trip.departureDate < latest) latest = trip.departureDate;

  return { earliest, latest };
}

export type ExperienceSlot = {
  date: string;
  startMinutes: number;
  endMinutes: number;
  /** Posted by the booking form and re-validated server-side. */
  value: string;
};

/** "2026-08-19|1200" — date and start time in one form value. */
export function slotValue(date: string, startMinutes: number): string {
  return `${date}|${startMinutes}`;
}

/**
 * Every session of this experience inside the window, keyed by date. Feeds the
 * portal calendar directly, and is the list the server checks a submitted slot
 * against.
 */
export function listSlotsByDate(
  experience: Experience,
  window: BookingWindow
): Record<string, ExperienceSlot[]> {
  const byDate: Record<string, ExperienceSlot[]> = {};

  if (window.latest < window.earliest) return byDate;

  for (let date = window.earliest; date <= window.latest; date = addDays(date, 1)) {
    const weekday = parseDate(date).getUTCDay();
    const sessions = experience.sessions.filter((session) => session.weekday === weekday);

    if (sessions.length === 0) continue;

    byDate[date] = sessions.map((session) => ({
      date,
      startMinutes: session.startMinutes,
      endMinutes: session.endMinutes,
      value: slotValue(date, session.startMinutes),
    }));
  }

  return byDate;
}

/**
 * The soonest bookable date, or null when nothing falls inside the window.
 * `listSlotsByDate` walks the window forwards, so the first key is the answer.
 */
export function nextAvailableDate(experience: Experience, window: BookingWindow): string | null {
  return Object.keys(listSlotsByDate(experience, window))[0] ?? null;
}

/** "Sat 15 Aug" — the compact form used on browse cards. */
export function formatDateShort(date: string): string {
  return parseDate(date).toLocaleDateString("en-MY", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
