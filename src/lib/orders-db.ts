import { getSupabase } from "./supabase";
import type { PassOrder } from "./fulfillment";

export type StoredOrder = PassOrder & {
  invoiceNumber: string;
  createdAt: string;
};

type OrderRow = {
  id: number;
  session_id: string;
  pass_key: string;
  pass_name: string;
  quantity: number;
  amount_total: number;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_intent_id: string | null;
  invoice_number: string;
  created_at: string;
};

function toStoredOrder(row: OrderRow): StoredOrder {
  return {
    sessionId: row.session_id,
    passKey: row.pass_key,
    passName: row.pass_name,
    quantity: row.quantity,
    amountTotal: row.amount_total,
    currency: row.currency,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    paymentIntentId: row.payment_intent_id,
    invoiceNumber: row.invoice_number,
    createdAt: row.created_at,
  };
}

/** "INV-2026-0001" — sequential per calendar year, based on row id. */
function invoiceNumberFor(rowId: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(rowId).padStart(4, "0")}`;
}

/**
 * Inserts an order the first time it's seen for a given `sessionId`.
 *
 * Stripe (and our own bypass path) can call fulfilment more than once for the
 * same order, so this is the idempotency boundary: a duplicate call reports
 * `inserted: false` and callers should skip side effects like sending email.
 */
export async function insertOrderIfNew(
  order: PassOrder
): Promise<{ inserted: boolean; stored: StoredOrder }> {
  const existing = await getOrderBySessionId(order.sessionId);
  if (existing) {
    return { inserted: false, stored: existing };
  }

  const db = getSupabase();

  // Placeholder invoice number swapped for the real one once we know the row id.
  const { data: inserted, error: insertError } = await db
    .from("orders")
    .insert({
      session_id: order.sessionId,
      pass_key: order.passKey,
      pass_name: order.passName,
      quantity: order.quantity,
      amount_total: order.amountTotal,
      currency: order.currency,
      customer_email: order.customerEmail,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      payment_intent_id: order.paymentIntentId,
      invoice_number: "",
    })
    .select()
    .single<OrderRow>();

  if (insertError || !inserted) {
    // Unique violation on session_id means a concurrent request won the race.
    const raced = await getOrderBySessionId(order.sessionId);
    if (raced) return { inserted: false, stored: raced };
    throw new Error(`Failed to insert order ${order.sessionId}: ${insertError?.message}`);
  }

  const invoiceNumber = invoiceNumberFor(inserted.id);
  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({ invoice_number: invoiceNumber })
    .eq("id", inserted.id)
    .select()
    .single<OrderRow>();

  if (updateError || !updated) {
    throw new Error(`Failed to set invoice number for order ${order.sessionId}: ${updateError?.message}`);
  }

  return { inserted: true, stored: toStoredOrder(updated) };
}

export async function getAllOrders(): Promise<StoredOrder[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from("orders")
    .select()
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error) {
    throw new Error(`Failed to list orders: ${error.message}`);
  }

  return (data ?? []).map(toStoredOrder);
}

export async function getOrderBySessionId(sessionId: string): Promise<StoredOrder | null> {
  const db = getSupabase();

  const { data, error } = await db
    .from("orders")
    .select()
    .eq("session_id", sessionId)
    .maybeSingle<OrderRow>();

  if (error) {
    throw new Error(`Failed to look up order ${sessionId}: ${error.message}`);
  }

  return data ? toStoredOrder(data) : null;
}
