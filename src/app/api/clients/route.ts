import { NextResponse } from "next/server";
import { AppError } from "@/domain/errors";
import { requireCurrentActiveUser } from "@/server/auth/current-user";
import { errorResponse } from "@/server/http";
import { listClients } from "@/server/clients/client-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const actor = await requireCurrentActiveUser();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "25");
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new AppError(
        "INVALID_INPUT",
        "Page must be at least 1 and limit must be between 1 and 100.",
      );
    }
    return NextResponse.json(listClients(actor, page, limit), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
