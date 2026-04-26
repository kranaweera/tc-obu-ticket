import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase-admin";
import { generateTicketPdf } from "@/lib/generatePdf";
import { saveTicket } from "@/lib/firestore";

function generateTicketNumber() {
  const prefix = "TCK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, paymentReference } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!paymentReference?.trim()) return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });

  const ticketNumber = generateTicketNumber();
  const trimmedName = (name as string).trim();

  await saveTicket({
    id: ticketNumber,
    name: trimmedName,
    paymentReference: (paymentReference as string).trim(),
    issuedAt: new Date().toISOString(),
    status: "valid",
    createdBy: decoded.email ?? decoded.uid,
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
