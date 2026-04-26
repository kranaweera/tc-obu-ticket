import { NextRequest, NextResponse } from "next/server";

// Auth is handled client-side (Firebase Auth state) and server-side (Firebase Admin token
// verification in each API route). No middleware session check needed.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
