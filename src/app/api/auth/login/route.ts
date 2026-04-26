import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

// Up to 3 accounts defined in environment variables
function getAccounts() {
  return [
    { email: process.env.ACCOUNT_1_EMAIL, hash: process.env.ACCOUNT_1_PASSWORD_HASH },
    { email: process.env.ACCOUNT_2_EMAIL, hash: process.env.ACCOUNT_2_PASSWORD_HASH },
    { email: process.env.ACCOUNT_3_EMAIL, hash: process.env.ACCOUNT_3_PASSWORD_HASH },
  ].filter((a): a is { email: string; hash: string } =>
    Boolean(a.email && a.hash)
  );
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const account = getAccounts().find((a) => a.email === email);
  if (!account || !(await bcrypt.compare(password, account.hash))) {
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
