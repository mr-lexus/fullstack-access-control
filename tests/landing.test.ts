import { beforeEach, describe, expect, it } from "vitest";
import { getLandingPath } from "@/server/auth/landing";
import { getStore, resetStore } from "@/server/data/store";

beforeEach(() => { resetStore(); });

describe("authenticated landing path", () => {
  it.each([
    ["ivan", "/manage-users"],
    ["anna", "/content"],
    ["olena", "/content"],
  ] as const)("sends %s to %s", (userId, expectedPath) => {
    expect(getLandingPath(getStore().users.get(userId)!)).toBe(expectedPath);
  });
});
