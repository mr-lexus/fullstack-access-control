import { beforeEach, describe, expect, it } from "vitest";
import { ROLES } from "@/domain/roles";
import { toPublicUser } from "@/domain/user";
import { AppError } from "@/domain/errors";
import { resetStore, getStore } from "@/server/data/store";
import {
  changeUserRole,
  changeUserStatus,
  createUser,
} from "@/server/users/user-service";

const actor = (id: string) => getStore().users.get(id)!;
beforeEach(() => {
  resetStore();
});

describe("user mutation authorization and invariants", () => {
  it("omits passwords from the public user representation", () => {
    expect(toPublicUser(actor("ivan"))).not.toHaveProperty("password");
  });
  it("rejects all manager protected mutations and permits IT mutations", () => {
    const anna = actor("anna");
    expect(() => createUser(anna, {})).toThrowError(/not allowed/);
    expect(() => changeUserRole(anna, "olena", ROLES.MANAGER)).toThrowError(
      /not allowed/,
    );
    expect(() => changeUserStatus(anna, "olena", "deactivated")).toThrowError(
      /not allowed/,
    );
    expect(
      createUser(actor("ivan"), {
        fullName: "New",
        email: "new@example.com",
        password: "x",
        role: ROLES.USER,
        status: "active",
        managerId: null,
      }).email,
    ).toBe("new@example.com");
  });

  it("uses distinct self and last-active IT status errors", () => {
    const ivan = actor("ivan");
    expect(() => changeUserStatus(ivan, "ivan", "deactivated")).toThrowError(
      AppError,
    );
    try {
      changeUserStatus(ivan, "ivan", "deactivated");
    } catch (error) {
      expect((error as AppError).code).toBe("CANNOT_DEACTIVATE_SELF");
    }
    changeUserStatus(ivan, "kateryna", "deactivated");
    try {
      changeUserStatus(ivan, "ivan", "deactivated");
    } catch (error) {
      expect((error as AppError).code).toBe("LAST_ACTIVE_IT");
    }
  });

  it("protects a generic self-role change and preserves final-IT precedence", () => {
    const ivan = actor("ivan");
    expect(() => changeUserRole(ivan, "ivan", ROLES.MANAGER)).toThrowError(
      AppError,
    );
    try {
      changeUserRole(ivan, "ivan", ROLES.MANAGER);
    } catch (error) {
      expect((error as AppError).code).toBe("CANNOT_CHANGE_OWN_ROLE");
    }
    changeUserStatus(ivan, "kateryna", "deactivated");
    try {
      changeUserRole(ivan, "ivan", ROLES.MANAGER);
    } catch (error) {
      expect((error as AppError).code).toBe("LAST_ACTIVE_IT");
    }
  });
});
