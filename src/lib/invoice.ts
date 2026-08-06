import type { StoredOrder } from "./orders-db";

function money(amountMinor: number, currency: string): string {
  return `${currency.toUpperCase()} ${(amountMinor / 100).toFixed(2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Self-contained, printable HTML invoice — used both as an email attachment body and a standalone page. */
export function buildInvoiceHtml(order: StoredOrder): string {
  const unitPrice = order.quantity > 0 ? order.amountTotal / order.quantity : order.amountTotal;
  const issued = new Date(order.createdAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHtml(order.invoiceNumber)} — Traveloop</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1a1a1a; max-width: 640px; margin: 40px auto; padding: 0 20px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .muted { color: #666; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
  th { color: #666; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  .amount { text-align: right; }
  .total-row td { border-bottom: none; border-top: 2px solid #1a1a1a; font-weight: 700; font-size: 16px; padding-top: 14px; }
  .grid { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 8px; }
  footer { margin-top: 32px; font-size: 12px; color: #888; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <header>
    <div>
      <div class="brand">Traveloop</div>
      <div class="muted">Penang, Malaysia</div>
    </div>
    <div>
      <h1>Invoice</h1>
      <div class="muted">${escapeHtml(order.invoiceNumber)}</div>
      <div class="muted">${escapeHtml(issued)}</div>
    </div>
  </header>

  <div class="grid">
    <div>
      <div class="muted">Billed to</div>
      <div>${escapeHtml(order.customerName ?? "Guest")}</div>
      <div>${escapeHtml(order.customerEmail ?? "")}</div>
      ${order.customerPhone ? `<div>${escapeHtml(order.customerPhone)}</div>` : ""}
    </div>
    <div>
      <div class="muted">Order reference</div>
      <div>${escapeHtml(order.sessionId)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="amount">Qty</th>
        <th class="amount">Unit price</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Traveloop ${escapeHtml(order.passName)} Pass</td>
        <td class="amount">${order.quantity}</td>
        <td class="amount">${money(unitPrice, order.currency)}</td>
        <td class="amount">${money(order.amountTotal, order.currency)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3">Total paid</td>
        <td class="amount">${money(order.amountTotal, order.currency)}</td>
      </tr>
    </tbody>
  </table>

  <footer>
    <p>This is an automatically generated invoice for a Traveloop pass purchase. Quote the order reference above if you contact us about this order.</p>
  </footer>
</body>
</html>`;
}
