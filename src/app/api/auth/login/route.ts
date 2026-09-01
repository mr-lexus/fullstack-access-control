import { NextResponse } from "next/server";
import { AppError } from "@/domain/errors";
import { toPublicUser, USER_STATUSES } from "@/domain/user";
import { getLandingPath } from "@/server/auth/landing";
import {
  authenticateCredentials,
  createSession,
  SESSION_COOKIE,
} from "@/server/auth/session";
import { readJson, errorResponse } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await readJson(request);
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      throw new AppError("INVALID_INPUT", "Email and password are required.");
    }
    const user = authenticateCredentials(body.email, body.password);
    if (!user)
      throw new AppError("UNAUTHENTICATED", "Invalid email or password.");
    if (user.status !== USER_STATUSES.ACTIVE)
      throw new AppError("ACCOUNT_DEACTIVATED", "This account is deactivated.");
    const sessionId = createSession(user.id);
    const response = NextResponse.json({
      user: toPublicUser(user),
      redirectTo: getLandingPath(user),
    });
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
