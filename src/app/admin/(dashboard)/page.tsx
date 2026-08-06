import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOrders } from "@/lib/orders-db";
import { Icon } from "@/app/components/Icons";

export const metadata: Metadata = {
  title: "Orders — Traveloop admin",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const orders = await getAllOrders();

  return (
    <section className="admin-orders">
      <h1>Orders</h1>
      <p className="admin-orders-count">
        {orders.length} order{orders.length === 1 ? "" : "s"}
      </p>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Pass</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Session</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.sessionId}>
                  <td>{order.invoiceNumber || "—"}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>{order.passName}</td>
                  <td>{order.quantity}</td>
                  <td>
                    {order.currency.toUpperCase()} {(order.amountTotal / 100).toFixed(2)}
                  </td>
                  <td>{order.customerName ?? "—"}</td>
                  <td>{order.customerEmail ?? "—"}</td>
                  <td>{order.customerPhone ?? "—"}</td>
                  <td className="admin-table-mono">{order.sessionId}</td>
                  <td>
                    <a
                      className="admin-icon-button"
                      href={`/api/orders/${order.sessionId}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      title="View invoice"
                      aria-label="View invoice"
                    >
                      <Icon name="receipt" />
                    </a>
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
