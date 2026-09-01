import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { resetStore } from "@/server/data/store";

beforeEach(() => {
  resetStore();
});

async function login(email: string, password: string) {
  return POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

function hasSessionCookie(response: Response): boolean {
  return Boolean(
    response.headers.get("set-cookie")?.match(/(?:^|,\s*)session=/),
  );
}

describe("login account status semantics", () => {
  it("keeps active login successful", async () => {
    const response = await login("ivan.it@example.com", "password123");

    expect(response.status).toBe(200);
    expect((await response.json()).user.id).toBe("ivan");
    expect(hasSessionCookie(response)).toBe(true);
  });

  it("rejects a deactivated account after valid credential authentication", async () => {
    const response = await login("petro.manager@example.com", "password123");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "ACCOUNT_DEACTIVATED",
        message: "This account is deactivated.",
      },
    });
    expect(hasSessionCookie(response)).toBe(false);
  });

  it("does not disclose deactivation for a wrong password", async () => {
    const response = await login("petro.manager@example.com", "wrong");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Invalid email or password.",
      },
    });
    expect(hasSessionCookie(response)).toBe(false);
  });

  it("uses the generic authentication error for an unknown email", async () => {
    const response = await login("unknown@example.com", "password123");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Invalid email or password.",
      },
    });
  });
});
