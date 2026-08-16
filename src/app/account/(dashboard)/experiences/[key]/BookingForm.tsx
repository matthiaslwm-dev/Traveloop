"use client";

import { useActionState, useMemo, useState } from "react";
import { createBooking, type BookingFormState } from "@/app/account/booking-actions";
import { Icon } from "@/app/components/Icons";
import {
  BOOKING_LEAD_DAYS,
  CANCELLATION_CUTOFF_HOURS,
  formatPrice,
  formatTimeRange,
  getExperience,
  parseDate,
  quoteBooking,
  type BookingWindow,
  type ExperienceSlot,
} from "@/app/data/experiences";

export type PassOption = {
  sessionId: string;
  passKey: string;
  passName: string;
  discountPercent: number;
  /** "1 Sep 2026 – 10 Sep 2026", or null for passes bought before trip dates existed. */
  tripLabel: string | null;
  window: BookingWindow;
  slotsByDate: Record<string, ExperienceSlot[]>;
};

type BookingFormProps = {
  experienceKey: string;
  passOptions: PassOption[];
  defaultPassSessionId: string;
};

/* ---- Month arithmetic for the calendar, on "YYYY-MM" keys ---- */

function monthOf(date: string): string {
  return date.slice(0, 7);
}

function addMonths(month: string, delta: number): string {
  const [year, index] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, index - 1 + delta, 1));
  return shifted.toISOString().slice(0, 7);
}

function monthLabel(month: string): string {
  return parseDate(`${month}-01`).toLocaleDateString("en-MY", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

/** Every date in the month as "YYYY-MM-DD", plus the Monday-first leading blanks. */
function monthGrid(month: string): { blanks: number; dates: string[] } {
  const [year, index] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, index - 1, 1));
  const dayCount = new Date(Date.UTC(year, index, 0)).getUTCDate();

  const dates: string[] = [];
  for (let day = 1; day <= dayCount; day += 1) {
    dates.push(`${month}-${String(day).padStart(2, "0")}`);
  }

  // getUTCDay is Sunday-first; the grid is Monday-first.
  return { blanks: (first.getUTCDay() + 6) % 7, dates };
}

const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * The whole booking flow on one screen: pick a pass (if there's a choice), a
 * date, a time, and who's coming — with the price updating as you go and a
 * single confirm at the end.
 *
 * Everything here is a convenience. The Server Action re-derives entitlement,
 * slot validity and the amount from the catalogue, so none of this state is
 * load-bearing for correctness.
 */
export default function BookingForm({
  experienceKey,
  passOptions,
  defaultPassSessionId,
}: BookingFormProps) {
  const experience = getExperience(experienceKey)!;

  const [state, formAction, pending] = useActionState<BookingFormState, FormData>(createBooking, {
    error: null,
  });

  const [passSessionId, setPassSessionId] = useState(defaultPassSessionId);
  const pass = passOptions.find((o) => o.sessionId === passSessionId) ?? passOptions[0];

  const availableDates = useMemo(
    () => Object.keys(pass.slotsByDate).sort(),
    [pass.slotsByDate]
  );

  const [month, setMonth] = useState(() => monthOf(availableDates[0] ?? pass.window.earliest));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  const [participants, setParticipants] = useState(experience.participants.min);
  const [children, setChildren] = useState(0);
  const [packageKey, setPackageKey] = useState(
    experience.pricing.mode === "packages" ? experience.pricing.options[0].key : ""
  );
  const [location, setLocation] = useState(
    experience.locationOptions?.find((o) => !o.comingSoon)?.value ?? ""
  );
  const [acknowledged, setAcknowledged] = useState(false);

  /** Switching pass changes the bookable window, so any prior date choice is void. */
  function choosePass(option: PassOption) {
    setPassSessionId(option.sessionId);
    setSelectedDate(null);
    setSlot(null);
    setMonth(monthOf(Object.keys(option.slotsByDate).sort()[0] ?? option.window.earliest));
  }

  const quote = quoteBooking(experience, pass.discountPercent, { participants, packageKey });

  const firstMonth = monthOf(availableDates[0] ?? pass.window.earliest);
  const lastMonth = monthOf(availableDates.at(-1) ?? pass.window.latest);
  const grid = monthGrid(month);
  const daySlots = selectedDate ? (pass.slotsByDate[selectedDate] ?? []) : [];

  const canSubmit = Boolean(slot) && acknowledged && !pending;

  if (availableDates.length === 0) {
    return (
      <div className="xp-book-panel">
        <div className="account-inline-empty">
          <p>
            There are no {experience.name} sessions we can offer you right now
            {pass.tripLabel
              ? ` between ${pass.tripLabel} — bookings need ${BOOKING_LEAD_DAYS} days' notice.`
              : "."}
          </p>
          <a className="button ghost dark" href="/contact">
            Talk to our team
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="xp-book-panel" action={formAction}>
      <input type="hidden" name="experienceKey" value={experience.key} />
      <input type="hidden" name="orderSessionId" value={pass.sessionId} />
      <input type="hidden" name="slot" value={slot ?? ""} />

      {passOptions.length > 1 && (
        <fieldset className="xp-field">
          <legend>Book with</legend>
          <div className="xp-chip-row">
            {passOptions.map((option) => (
              <button
                key={option.sessionId}
                type="button"
                className={`xp-chip${option.sessionId === pass.sessionId ? " is-selected" : ""}`}
                onClick={() => choosePass(option)}
              >
                {option.passName} Pass
                {option.discountPercent > 0 && <small>{option.discountPercent}% off</small>}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="xp-field">
        <legend>Pick a date</legend>
        <p className="xp-field-hint">
          Only dates with a session are selectable.
          {pass.tripLabel && ` Limited to your trip: ${pass.tripLabel}.`}
        </p>

        <div className="xp-calendar">
          <div className="xp-calendar-head">
            <button
              type="button"
              className="xp-calendar-nav"
              onClick={() => setMonth(addMonths(month, -1))}
              disabled={month <= firstMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span>{monthLabel(month)}</span>
            <button
              type="button"
              className="xp-calendar-nav"
              onClick={() => setMonth(addMonths(month, 1))}
              disabled={month >= lastMonth}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="xp-calendar-grid" role="grid">
            {WEEKDAY_INITIALS.map((initial, index) => (
              <span key={index} className="xp-calendar-weekday" aria-hidden="true">
                {initial}
              </span>
            ))}

            {Array.from({ length: grid.blanks }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}

            {grid.dates.map((date) => {
              const available = Boolean(pass.slotsByDate[date]);

              return (
                <button
                  key={date}
                  type="button"
                  className={`xp-calendar-day${date === selectedDate ? " is-selected" : ""}${
                    available ? " is-available" : ""
                  }`}
                  disabled={!available}
                  aria-pressed={date === selectedDate}
                  onClick={() => {
                    setSelectedDate(date);
                    // One session that day? Choosing the date is choosing it.
                    const slots = pass.slotsByDate[date] ?? [];
                    setSlot(slots.length === 1 ? slots[0].value : null);
                  }}
                >
                  {Number(date.slice(8))}
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      {selectedDate && (
        <fieldset className="xp-field">
          <legend>Pick a time</legend>
          <div className="xp-chip-row">
            {daySlots.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`xp-chip${option.value === slot ? " is-selected" : ""}`}
                onClick={() => setSlot(option.value)}
              >
                {formatTimeRange(option.startMinutes, option.endMinutes)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {experience.pricing.mode === "packages" && (
        <fieldset className="xp-field">
          <legend>Choose your package</legend>
          <div className="xp-option-list">
            {experience.pricing.options.map((option) => (
              <label
                key={option.key}
                className={`xp-option${option.key === packageKey ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="packageKey"
                  value={option.key}
                  checked={option.key === packageKey}
                  onChange={() => setPackageKey(option.key)}
                />
                <span className="xp-option-main">
                  <strong>{option.label}</strong>
                  {option.note && <small>{option.note}</small>}
                </span>
                <span className="xp-option-price">{formatPrice(option.priceCents)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {experience.locationOptions && (
        <label className="admin-field xp-field">
          <span>Location</span>
          <select name="location" value={location} onChange={(e) => setLocation(e.target.value)}>
            {experience.locationOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.comingSoon}>
                {option.label}
                {option.comingSoon ? " — coming soon" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset className="xp-field">
        <legend>Who&apos;s coming</legend>

        <Stepper
          name="participants"
          label={experience.participants.label}
          hint={
            experience.pricing.mode === "group"
              ? `Group package covers up to ${experience.pricing.includedParticipants}`
              : undefined
          }
          value={participants}
          min={experience.participants.min}
          max={experience.participants.max}
          onChange={setParticipants}
        />

        {experience.freeChildAgeUnder && (
          <Stepper
            name="childrenCount"
            label={`Children under ${experience.freeChildAgeUnder}`}
            hint="Join free — not counted above"
            value={children}
            min={0}
            max={experience.participants.max}
            onChange={setChildren}
          />
        )}
      </fieldset>

      <label className="admin-field xp-field">
        <span>Anything we should know? (optional)</span>
        <textarea
          name="customerNotes"
          rows={3}
          maxLength={500}
          placeholder="Dietary needs, mobility requirements, a birthday to mark…"
        />
      </label>

      <div className="xp-summary">
        <p className="xp-summary-title">Your booking</p>
        <ul className="xp-summary-lines">
          {quote.lines.map((line) => (
            <li key={line.label}>
              <span>{line.label}</span>
              <span>{formatPrice(line.amountCents)}</span>
            </li>
          ))}
        </ul>
        <div className="xp-summary-total">
          <span>Payable at the venue</span>
          <span className="xp-summary-total-amounts">
            {quote.savingsCents > 0 && (
              <span className="xp-summary-was">{formatPrice(quote.regularTotalCents)}</span>
            )}
            <strong>{formatPrice(quote.totalCents)}</strong>
          </span>
        </div>
        {quote.savingsCents > 0 && (
          <p className="xp-summary-saving">
            <Icon name="bolt" />
            Your {pass.passName} Pass saves you {formatPrice(quote.savingsCents)} on this booking.
          </p>
        )}
      </div>

      <label className="register-consent">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        <span>
          I understand nothing is charged now — {formatPrice(quote.totalCents)} is payable at the
          venue on the day — and that I can cancel free of charge up to{" "}
          {CANCELLATION_CUTOFF_HOURS} hours before the session.
        </span>
      </label>

      {state.error && (
        <p className="checkout-error" role="alert">
          {state.error}
        </p>
      )}

      <button className="button primary xp-submit" type="submit" disabled={!canSubmit} aria-busy={pending}>
        {pending ? (
          <>
            <span className="checkout-spinner" aria-hidden="true" />
            Booking…
          </>
        ) : (
          <>
            Confirm booking
            <Icon name="arrowRight" />
          </>
        )}
      </button>
    </form>
  );
}

type StepperProps = {
  name: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function Stepper({ name, label, hint, value, min, max, onChange }: StepperProps) {
  return (
    <div className="xp-stepper">
      <span className="xp-stepper-label">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span className="xp-stepper-controls">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Fewer — ${label}`}
        >
          −
        </button>
        <output>{value}</output>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`More — ${label}`}
        >
          +
        </button>
      </span>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
