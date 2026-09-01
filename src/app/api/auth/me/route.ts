import { NextResponse } from "next/server";
import { requireCurrentActiveUser } from "@/server/auth/current-user";
import { errorResponse } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const { password: _password, ...user } = await requireCurrentActiveUser();
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
