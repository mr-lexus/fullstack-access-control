import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/server/auth/current-user";
import { destroySession, SESSION_COOKIE } from "@/server/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  destroySession(await getSessionIdFromCookie());
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
