import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrdersByUserId } from "@/lib/orders-db";
import { bestOrderFor } from "@/lib/booking";
import { Icon } from "@/app/components/Icons";
import {
  describeSchedule,
  formatDateLong,
  getEntitlement,
  getExperience,
  listSlotsByDate,
  resolveBookingWindow,
} from "@/app/data/experiences";
import { passTiers } from "@/app/data/passes";
import BookingForm, { type PassOption } from "./BookingForm";

type BookExperiencePageProps = {
  params: Promise<{ key: string }>;
};

export async function generateMetadata({ params }: BookExperiencePageProps): Promise<Metadata> {
  const experience = getExperience((await params).key);

  return {
    title: experience ? `Book the ${experience.name} — Traveloop` : "Book an experience — Traveloop",
    robots: { index: false, follow: false },
  };
}

export default async function BookExperiencePage({ params }: BookExperiencePageProps) {
  const experience = getExperience((await params).key);
  if (!experience) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account/login");
  }

  const orders = await getOrdersByUserId(user.id);

  /**
   * One option per pass that covers this experience. The bookable dates are
   * resolved per pass, not once for the page, because the window is narrowed
   * to that purchase's trip dates — two passes can offer different dates.
   */
  const passOptions: PassOption[] = orders
    .filter((order) => getEntitlement(order.passKey, experience).entitled)
    .map((order) => {
      const window = resolveBookingWindow(order);

      return {
        sessionId: order.sessionId,
        passKey: order.passKey,
        passName: order.passName,
        discountPercent: getEntitlement(order.passKey, experience).discountPercent,
        tripLabel:
          order.arrivalDate && order.departureDate
            ? `${formatDateLong(order.arrivalDate)} – ${formatDateLong(order.departureDate)}`
            : null,
        window,
        slotsByDate: listSlotsByDate(experience, window),
      };
    });

  if (passOptions.length === 0) {
    const unlockedBy = passTiers
      .filter((tier) => experience.discountByTier[tier.key] !== undefined)
      .map((tier) => tier.name)
      .join(" or ");

    return (
      <section className="account-section">
        <Link className="xp-back" href="/account/experiences">
          <Icon name="arrowRight" /> All experiences
        </Link>
        <div className="account-empty">
          <p>
            The {experience.name} is included with the {unlockedBy} pass
            {orders.length > 0 ? ", which isn't the pass you hold" : ""}.
          </p>
          <Link className="button primary" href="/passes#pricing">
            Compare passes
          </Link>
        </div>
      </section>
    );
  }

  const preferred = bestOrderFor(experience, orders);
  const defaultPass =
    passOptions.find((option) => option.sessionId === preferred?.sessionId) ?? passOptions[0];

  return (
    <>
      <Link className="xp-back" href="/account/experiences">
        <Icon name="arrowRight" /> All experiences
      </Link>

      <div className="xp-book-layout">
        <aside className="xp-book-aside">
          <div className="xp-book-hero">
            <img src={experience.image} alt="" />
          </div>
          <h1>{experience.name}</h1>
          <p className="xp-book-tagline">{experience.tagline}</p>
          <p className="xp-book-description">{experience.description}</p>

          <dl className="xp-book-meta">
            <div>
              <dt>Runs</dt>
              <dd>{describeSchedule(experience)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{experience.durationLabel}</dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>
                {experience.venue ?? experience.venueNote}
                {/* Lion Dance has both: a city-level venue plus a note that the
                    exact address follows once the troupe is booked. */}
                {experience.venue && experience.venueNote && (
                  <small className="xp-book-meta-note">{experience.venueNote}</small>
                )}
              </dd>
            </div>
          </dl>

          <p className="xp-book-section-label">What&apos;s included</p>
          <ul className="xp-book-list">
            {experience.includes.map((item) => (
              <li key={item}>
                <Icon name="bolt" />
                {item}
              </li>
            ))}
          </ul>

          <p className="xp-book-section-label">Know before you go</p>
          <ul className="xp-book-list muted">
            {experience.knowBeforeYouGo.map((item) => (
              <li key={item}>
                <Icon name="bolt" />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <BookingForm
          experienceKey={experience.key}
          passOptions={passOptions}
          defaultPassSessionId={defaultPass.sessionId}
        />
      </div>
    </>
  );
}
