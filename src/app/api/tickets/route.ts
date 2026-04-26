import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase-admin";
import { getAllTickets } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAllTickets());
}
