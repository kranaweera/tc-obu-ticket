import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateTicketPdf } from "@/lib/generatePdf";
import { saveTicket } from "@/lib/store";

function generateTicketNumber() {
  const prefix = "TCK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const ticketNumber = generateTicketNumber();
  const trimmedName = name.trim();

  await saveTicket({
    id: ticketNumber,
    name: trimmedName,
    issuedAt: new Date().toISOString(),
    status: "valid",
  });

  const pdfBytes = await generateTicketPdf(trimmedName, ticketNumber);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${ticketNumber}.pdf"`,
      "X-Ticket-Id": ticketNumber,
    },
  });
}
