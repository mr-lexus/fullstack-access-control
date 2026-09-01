import { randomUUID } from "node:crypto";
import { getStore } from "@/server/data/store";
import type { UserRecord } from "@/domain/user";

export const SESSION_COOKIE = "session";

export function authenticateCredentials(
  email: string,
  password: string,
): UserRecord | undefined {
  const normalizedEmail = email.trim().toLowerCase();
  const user = [...getStore().users.values()].find(
    (candidate) => candidate.email === normalizedEmail,
  );
  if (!user || user.password !== password) return undefined;
  return user;
}

export function createSession(userId: string): string {
  const sessionId = randomUUID();
  getStore().sessions.set(sessionId, { userId });
  return sessionId;
}

export function destroySession(sessionId: string | undefined): void {
  if (sessionId) getStore().sessions.delete(sessionId);
}

export function resolveSessionUser(
  sessionId: string | undefined,
): UserRecord | undefined {
  if (!sessionId) return undefined;
  const session = getStore().sessions.get(sessionId);
  if (!session) return undefined;
  return getStore().users.get(session.userId);
}
