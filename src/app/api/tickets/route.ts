import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllTickets } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await getAllTickets();
  return NextResponse.json(tickets);
}
