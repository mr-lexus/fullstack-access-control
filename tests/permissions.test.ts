import { beforeEach, describe, expect, it } from "vitest";
import { resetStore, getStore } from "@/server/data/store";
import { listUsers, updateUserProfile } from "@/server/users/user-service";
import { AppError } from "@/domain/errors";

const actor = (id: string) => getStore().users.get(id)!;

beforeEach(() => { resetStore(); });

describe("manager object-level permissions", () => {
  it("allows Anna to edit exactly her four direct reports", () => {
    const anna = actor("anna");
    expect(listUsers(anna).map((user) => user.id)).toEqual(["olena", "taras", "nina", "bohdan"]);
    for (const id of ["olena", "taras", "nina", "bohdan"]) {
      expect(updateUserProfile(anna, id, { fullName: "Updated" }).fullName).toBe("Updated");
    }
  });

  it("rejects Dmytro, self, and arbitrary users", () => {
    const anna = actor("anna");
    for (const id of ["dmytro", "anna", "ivan"]) {
      expect(() => updateUserProfile(anna, id, { fullName: "Nope" })).toThrowError(AppError);
      try { updateUserProfile(anna, id, { fullName: "Nope" }); } catch (error) { expect((error as AppError).code).toBe("FORBIDDEN"); }
    }
  });

  it("does not let profile updates smuggle protected fields", () => {
    expect(() => updateUserProfile(actor("anna"), "olena", { role: "IT" })).toThrowError(/Only fullName and email/);
    expect(getStore().users.get("olena")?.role).toBe("user");
  });
});
