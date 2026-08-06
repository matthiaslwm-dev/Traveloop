import { NextResponse } from "next/server";
import { getOrderBySessionId } from "@/lib/orders-db";
import { buildInvoiceHtml } from "@/lib/invoice";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ sessionId: string }> };

/** Serves a printable HTML invoice for a fulfilled order — the same document emailed to the buyer. */
export async function GET(_request: Request, { params }: RouteParams) {
  const { sessionId } = await params;

  const order = await getOrderBySessionId(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  return new NextResponse(buildInvoiceHtml(order), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
