import PDFDocument from "pdfkit";
import type { StoredOrder } from "./orders-db";

export type InvoiceLineItem = {
  label: string;
  amountCents: number;
};

/** One row per registration when available, falling back to a single summary row for legacy orders. */
export function invoiceLineItemsFor(
  order: StoredOrder,
  registrations: { passName: string; unitAmountCents: number }[]
): InvoiceLineItem[] {
  if (registrations.length === 0) {
    return [{ label: `Traveloop ${order.passName} Pass`, amountCents: order.amountTotal }];
  }

  return registrations.map((reg) => ({
    label: `Traveloop ${reg.passName} Pass`,
    amountCents: reg.unitAmountCents,
  }));
}

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
export function buildInvoiceHtml(order: StoredOrder, lineItems: InvoiceLineItem[]): string {
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
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems
        .map(
          (item) => `<tr>
        <td>${escapeHtml(item.label)}</td>
        <td class="amount">${money(item.amountCents, order.currency)}</td>
      </tr>`
        )
        .join("\n")}
      <tr class="total-row">
        <td>Total paid</td>
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

/** Same invoice as buildInvoiceHtml, laid out as a one-page PDF — used for the email attachment. */
export function buildInvoicePdf(order: StoredOrder, lineItems: InvoiceLineItem[]): Promise<Buffer> {
  const issued = new Date(order.createdAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const black = "#1a1a1a";
    const muted = "#666666";

    doc
      .fillColor(black)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("Traveloop", { continued: false });
    doc.fillColor(muted).font("Helvetica").fontSize(11).text("Penang, Malaysia");

    const headerTop = doc.y - 33;
    doc
      .fillColor(black)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Invoice", 0, headerTop, { width: pageWidth, align: "right" });
    doc
      .fillColor(muted)
      .font("Helvetica")
      .fontSize(11)
      .text(order.invoiceNumber, { width: pageWidth, align: "right" })
      .text(issued, { width: pageWidth, align: "right" });

    doc
      .moveTo(doc.page.margins.left, doc.y + 10)
      .lineTo(doc.page.margins.left + pageWidth, doc.y + 10)
      .lineWidth(1.5)
      .strokeColor(black)
      .stroke();
    doc.moveDown(2.2);

    const detailsTop = doc.y;
    doc.fillColor(muted).fontSize(10).text("Billed to", doc.page.margins.left, detailsTop);
    doc
      .fillColor(black)
      .fontSize(12)
      .text(order.customerName ?? "Guest")
      .text(order.customerEmail ?? "");
    if (order.customerPhone) doc.text(order.customerPhone);

    const halfWidth = pageWidth / 2;
    doc
      .fillColor(muted)
      .fontSize(10)
      .text("Order reference", doc.page.margins.left + halfWidth, detailsTop, { width: halfWidth });
    doc
      .fillColor(black)
      .fontSize(12)
      .text(order.sessionId, doc.page.margins.left + halfWidth, doc.y, { width: halfWidth });

    doc.moveDown(2.5);

    const tableTop = doc.y;
    const col = {
      item: doc.page.margins.left,
      amount: doc.page.margins.left + pageWidth * 0.75,
    };
    const colWidth = {
      item: pageWidth * 0.75 - 10,
      amount: pageWidth * 0.25,
    };

    doc.font("Helvetica-Bold").fontSize(9).fillColor(muted);
    doc.text("ITEM", col.item, tableTop);
    doc.text("AMOUNT", col.amount, tableTop, { width: colWidth.amount, align: "right" });

    const rowTop = tableTop + 18;
    doc
      .moveTo(doc.page.margins.left, rowTop - 4)
      .lineTo(doc.page.margins.left + pageWidth, rowTop - 4)
      .lineWidth(0.5)
      .strokeColor("#e5e5e5")
      .stroke();

    doc.font("Helvetica").fontSize(11).fillColor(black);
    const rowHeight = 22;
    lineItems.forEach((item, index) => {
      const y = rowTop + index * rowHeight;
      doc.text(item.label, col.item, y, { width: colWidth.item });
      doc.text(money(item.amountCents, order.currency), col.amount, y, {
        width: colWidth.amount,
        align: "right",
      });
    });

    const totalTop = rowTop + lineItems.length * rowHeight + 6;
    doc
      .moveTo(doc.page.margins.left, totalTop - 8)
      .lineTo(doc.page.margins.left + pageWidth, totalTop - 8)
      .lineWidth(1.5)
      .strokeColor(black)
      .stroke();
    doc.font("Helvetica-Bold").fontSize(13);
    doc.text("Total paid", col.item, totalTop);
    doc.text(money(order.amountTotal, order.currency), col.amount, totalTop, {
      width: colWidth.amount,
      align: "right",
    });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(muted)
      .text(
        "This is an automatically generated invoice for a Traveloop pass purchase. Quote the order reference above if you contact us about this order.",
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom - 30,
        { width: pageWidth }
      );

    doc.end();
  });
}
