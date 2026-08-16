import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrderBySessionId } from "@/lib/orders-db";
import { getPassRegistrationsByOrder } from "@/lib/pass-registrations-db";

export const metadata: Metadata = {
  title: "Order registrations — Traveloop admin",
  robots: { index: false, follow: false },
};

type OrderDetailPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { sessionId } = await params;
  const order = await getOrderBySessionId(sessionId);
  if (!order) {
    notFound();
  }

  const registrations = await getPassRegistrationsByOrder(sessionId);

  return (
    <section className="admin-orders">
      <Link href="/admin" className="admin-summary-back">
        ← All orders
      </Link>
      <h1>
        {order.passName} — {order.invoiceNumber || order.sessionId}
      </h1>
      <p className="admin-orders-count">
        {order.customerName ?? "Guest"} · {order.customerEmail ?? "—"} · {order.quantity} pass
        {order.quantity === 1 ? "" : "es"}
      </p>

      {registrations.length === 0 ? (
        <p>No registration details on file for this order.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pass</th>
                <th>Name</th>
                <th>Nationality</th>
                <th>Document</th>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Emergency contact</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg, index) => (
                <tr key={reg.id}>
                  <td>{index + 1}</td>
                  <td>{reg.passName}</td>
                  <td>{reg.fullName}</td>
                  <td>{reg.nationality}</td>
                  <td>
                    {reg.travelDocumentType} {reg.travelDocumentNumber}
                  </td>
                  <td>{reg.arrivalDate}</td>
                  <td>{reg.departureDate}</td>
                  <td>
                    {reg.emergencyContactName
                      ? `${reg.emergencyContactName} (${reg.emergencyContactRelationship ?? "—"}) · ${
                          reg.emergencyContactPhone ?? "—"
                        }`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
