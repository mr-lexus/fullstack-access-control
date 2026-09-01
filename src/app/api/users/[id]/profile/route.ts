import { NextResponse } from "next/server";
import { requireCurrentActiveUser } from "@/server/auth/current-user";
import { errorResponse, readJson } from "@/server/http";
import { updateUserProfile } from "@/server/users/user-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    return NextResponse.json({
      user: updateUserProfile(
        await requireCurrentActiveUser(),
        id,
        await readJson(request),
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
