import { NextResponse } from "next/server";
import { requireCurrentActiveUser } from "@/server/auth/current-user";
import { errorResponse, readJson } from "@/server/http";
import { changeUserStatus } from "@/server/users/user-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    return NextResponse.json({ user: changeUserStatus(await requireCurrentActiveUser(), id, body.status) });
  } catch (error) {
    return errorResponse(error);
  }
}
