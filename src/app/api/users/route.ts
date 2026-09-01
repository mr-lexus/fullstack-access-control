import { NextResponse } from "next/server";
import { requireCurrentActiveUser } from "@/server/auth/current-user";
import { errorResponse, readJson } from "@/server/http";
import { createUser, listUsers } from "@/server/users/user-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(
      { users: listUsers(await requireCurrentActiveUser()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    return NextResponse.json(
      {
        user: createUser(
          await requireCurrentActiveUser(),
          await readJson(request),
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
