import { cookies } from "next/headers";
import { AppError } from "@/domain/errors";
import type { UserRecord } from "@/domain/user";
import { SESSION_COOKIE, resolveSessionUser } from "./session";

export async function getSessionIdFromCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export function getCurrentActiveUser(sessionId: string | undefined): UserRecord | undefined {
  const user = resolveSessionUser(sessionId);
  return user?.status === "active" ? user : undefined;
}

export async function requireCurrentActiveUser(): Promise<UserRecord> {
  const user = getCurrentActiveUser(await getSessionIdFromCookie());
  if (!user) throw new AppError("UNAUTHENTICATED", "An active authenticated session is required.");
  return user;
}

export type PageAuth =
  | { kind: "unauthenticated" }
  | { kind: "forbidden"; user: UserRecord }
  | { kind: "authorized"; user: UserRecord };

export async function getPageAuth(canAccess: (user: UserRecord) => boolean): Promise<PageAuth> {
  const user = getCurrentActiveUser(await getSessionIdFromCookie());
  if (!user) return { kind: "unauthenticated" };
  return canAccess(user) ? { kind: "authorized", user } : { kind: "forbidden", user };
}
