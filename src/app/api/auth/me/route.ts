import { NextResponse } from "next/server";
import { toPublicUser } from "@/domain/user";
import { requireCurrentActiveUser } from "@/server/auth/current-user";
import { errorResponse } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(
      { user: toPublicUser(await requireCurrentActiveUser()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
