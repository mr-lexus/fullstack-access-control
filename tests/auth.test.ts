import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "@/server/data/store";
import { authenticateCredentials, createSession, resolveSessionUser } from "@/server/auth/session";
import { changeUserStatus } from "@/server/users/user-service";

beforeEach(() => { resetStore(); });

describe("opaque live sessions", () => {
  it("authenticates active users and rejects wrong passwords/deactivated users", () => {
    expect(authenticateCredentials("IVAN.IT@EXAMPLE.COM", "password123")?.id).toBe("ivan");
    expect(authenticateCredentials("ivan.it@example.com", "wrong")).toBeUndefined();
    expect(authenticateCredentials("petro.manager@example.com", "password123")).toBeUndefined();
  });

  it("stops authorizing the same session immediately after deactivation", () => {
    const olena = authenticateCredentials("olena.user@example.com", "password123")!;
    const session = createSession(olena.id);
    expect(resolveSessionUser(session)?.id).toBe("olena");
    changeUserStatus(resolveSessionUser(createSession("ivan"))!, "olena", "deactivated");
    expect(resolveSessionUser(session)?.status).toBe("deactivated");
  });
});
