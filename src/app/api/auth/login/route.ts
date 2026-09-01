import { NextResponse } from "next/server";
import { AppError } from "@/domain/errors";
import { CAPABILITIES } from "@/domain/roles";
import { authenticateCredentials, createSession, SESSION_COOKIE } from "@/server/auth/session";
import { can } from "@/server/auth/permissions";
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
    if (!user) throw new AppError("UNAUTHENTICATED", "Invalid email or password.");
    const sessionId = createSession(user.id);
    const response = NextResponse.json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      redirectTo: can(user, CAPABILITIES.VIEW_ALL_USERS) ? "/manage-users" : "/content",
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
