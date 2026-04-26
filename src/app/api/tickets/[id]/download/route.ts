import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTicket } from "@/lib/firestore";
import { generateTicketPdf } from "@/lib/generatePdf";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfBytes = await generateTicketPdf(ticket.name, ticket.id);
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${ticket.id}.pdf"`,
    },
  });
}
