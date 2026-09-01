import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "@/server/data/store";
import { authenticateCredentials, createSession } from "@/server/auth/session";
import { getCurrentActiveUser } from "@/server/auth/current-user";
import { changeUserStatus } from "@/server/users/user-service";

beforeEach(() => { resetStore(); });

describe("live protected-request status", () => {
  it("rejects an existing session after the user is deactivated", () => {
    const olena = authenticateCredentials("olena.user@example.com", "password123")!;
    const session = createSession(olena.id);
    const ivan = authenticateCredentials("ivan.it@example.com", "password123")!;
    expect(getCurrentActiveUser(session)?.id).toBe("olena");
    changeUserStatus(ivan, olena.id, "deactivated");
    expect(getCurrentActiveUser(session)).toBeUndefined();
  });
});
