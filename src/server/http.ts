import { NextResponse } from "next/server";
import { AppError, isAppError } from "@/domain/errors";

export function errorResponse(error: unknown): NextResponse {
  const appError = isAppError(error)
    ? error
    : new AppError("INTERNAL_ERROR", "An unexpected server error occurred.");
  if (!isAppError(error)) console.error("Unexpected server error", error);
  return NextResponse.json(
    { error: { code: appError.code, message: appError.message } },
    { status: appError.status },
  );
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error("not an object");
    return body as Record<string, unknown>;
  } catch {
    throw new AppError("INVALID_INPUT", "Request body must be a JSON object.");
  }
}
