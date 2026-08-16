import { NextResponse } from "next/server";
import { getOrderBySessionId } from "@/lib/orders-db";
import { getPassRegistrationsByOrder } from "@/lib/pass-registrations-db";
import { buildInvoiceHtml, buildInvoicePdf, invoiceLineItemsFor } from "@/lib/invoice";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ sessionId: string }> };

/**
 * Serves the invoice for a fulfilled order — the same document emailed to the
 * buyer. Defaults to printable HTML; `?format=pdf` downloads the PDF, which is
 * what the customer portal links to.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { sessionId } = await params;

  const order = await getOrderBySessionId(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const registrations = await getPassRegistrationsByOrder(sessionId);
  const lineItems = invoiceLineItemsFor(order, registrations);

  if (new URL(request.url).searchParams.get("format") === "pdf") {
    const pdf = await buildInvoicePdf(order, lineItems);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${order.invoiceNumber || "invoice"}.pdf"`,
      },
    });
  }

  return new NextResponse(buildInvoiceHtml(order, lineItems), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
