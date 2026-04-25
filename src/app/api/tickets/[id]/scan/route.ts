import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTicket, updateTicket } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) {
    return NextResponse.json({ valid: false, reason: "Ticket not found" }, { status: 404 });
  }

  if (ticket.status === "used") {
    return NextResponse.json({
      valid: false,
      reason: "Already scanned",
      ticket,
    });
  }

  if (ticket.status === "cancelled") {
    return NextResponse.json({
      valid: false,
      reason: "Ticket cancelled",
      ticket,
    });
  }

  const updated = await updateTicket(id, {
    status: "used",
    scannedAt: new Date().toISOString(),
  });

  return NextResponse.json({ valid: true, ticket: updated });
}
