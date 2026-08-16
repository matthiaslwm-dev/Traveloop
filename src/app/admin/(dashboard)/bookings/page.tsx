import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllBookings, type StoredBooking } from "@/lib/experience-bookings-db";
import { getAllOrders } from "@/lib/orders-db";
import { isAdminUser } from "@/lib/admin-auth";
import { isPastSession } from "@/lib/booking";
import { setBookingStatus } from "@/app/admin/booking-actions";
import {
  formatDateLong,
  formatPrice,
  formatTimeRange,
  getExperience,
} from "@/app/data/experiences";

export const metadata: Metadata = {
  title: "Admin · Experience bookings",
  robots: { index: false, follow: false },
};

type BookingsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** The transitions worth offering from each state — cancelled is deliberately terminal. */
const NEXT_STATUSES: Record<StoredBooking["status"], StoredBooking["status"][]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const ACTION_LABELS: Record<StoredBooking["status"], string> = {
  pending: "Reopen",
  confirmed: "Confirm",
  completed: "Mark completed",
  cancelled: "Cancel",
};

export default async function AdminBookingsPage({ searchParams }: BookingsPageProps) {
  const supabase = await createClient();
  if (!(await isAdminUser(supabase))) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const updated = typeof params.updated === "string" ? params.updated : null;
  const failed = params.error === "1";

  const [bookings, orders] = await Promise.all([getAllBookings(), getAllOrders()]);

  // One lookup pass instead of a query per booking — the admin list is small
  // enough that loading both tables and joining in memory is the cheap option.
  const customerBySession = new Map(
    orders.map((order) => [order.sessionId, order] as const)
  );

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && !isPastSession(b));

  return (
    <section className="admin-orders">
      <h1>Experience bookings</h1>
      <p className="admin-orders-count">
        {bookings.length} booking{bookings.length === 1 ? "" : "s"} · {pendingCount} awaiting
        confirmation · {upcoming.length} upcoming
      </p>

      {updated && <p className="account-success">Booking {updated} updated.</p>}
      {failed && <p className="admin-login-error">Couldn&apos;t update that booking.</p>}

      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Status</th>
                <th>Session</th>
                <th>Experience</th>
                <th>Venue</th>
                <th>Pax</th>
                <th>Payable</th>
                <th>Customer</th>
                <th>Pass</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const order = customerBySession.get(booking.orderSessionId);
                const experience = getExperience(booking.experienceKey);
                const packageLabel =
                  experience?.pricing.mode === "packages"
                    ? experience.pricing.options.find((o) => o.key === booking.packageKey)?.label
                    : null;

                return (
                  <tr key={booking.reference}>
                    <td className="admin-table-mono">{booking.reference}</td>
                    <td>
                      <span className={`xp-booking-status status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      {formatDateLong(booking.sessionDate)}
                      <br />
                      <span className="admin-table-mono">
                        {formatTimeRange(booking.startMinutes, booking.endMinutes)}
                      </span>
                    </td>
                    <td>
                      {booking.experienceName}
                      {packageLabel && (
                        <>
                          <br />
                          <span className="admin-table-mono">{packageLabel}</span>
                        </>
                      )}
                    </td>
                    <td>{booking.location ?? "To advise"}</td>
                    <td>
                      {booking.participants}
                      {booking.childrenCount > 0 && ` +${booking.childrenCount}c`}
                    </td>
                    <td>{formatPrice(booking.quotedAmountCents)}</td>
                    <td>
                      {order?.customerName ?? "—"}
                      <br />
                      <span className="admin-table-mono">{order?.customerEmail ?? "—"}</span>
                    </td>
                    <td className="xp-booking-pass">{booking.passKey}</td>
                    <td className="admin-note-cell">{booking.customerNotes ?? "—"}</td>
                    <td>
                      {NEXT_STATUSES[booking.status].length === 0 ? (
                        "—"
                      ) : (
                        // One form, one note field: the submit buttons carry the
                        // target status themselves, so the note the operator
                        // types is attached to whichever action they press.
                        <form className="admin-booking-actions" action={setBookingStatus}>
                          <input type="hidden" name="reference" value={booking.reference} />
                          <input
                            className="admin-note-input"
                            name="adminNotes"
                            placeholder="Message to customer (optional)"
                            defaultValue={booking.adminNotes ?? ""}
                          />
                          {NEXT_STATUSES[booking.status].map((next) => (
                            <button
                              key={next}
                              className={`button ${
                                next === "cancelled" ? "ghost dark" : "primary"
                              } admin-logout`}
                              type="submit"
                              name="status"
                              value={next}
                            >
                              {ACTION_LABELS[next]}
                            </button>
                          ))}
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
