import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

function getAccounts() {
  return [
    { email: process.env.ACCOUNT_1_EMAIL, password: process.env.ACCOUNT_1_PASSWORD },
    { email: process.env.ACCOUNT_2_EMAIL, password: process.env.ACCOUNT_2_PASSWORD },
    { email: process.env.ACCOUNT_3_EMAIL, password: process.env.ACCOUNT_3_PASSWORD },
  ].filter((a): a is { email: string; password: string } =>
    Boolean(a.email && a.password)
  );
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const account = getAccounts().find(
    (a) => a.email === email && a.password === password
  );

  if (!account) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
