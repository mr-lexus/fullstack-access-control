import { beforeEach, describe, expect, it } from "vitest";
import {
  CAPABILITIES,
  ROLE_DEFINITIONS,
  ROLES,
  hasCapability,
  type Capability,
  type Role,
} from "@/domain/roles";
import type { User } from "@/domain/user";
import { getLandingPath } from "@/server/auth/landing";
import { getStore, resetStore } from "@/server/data/store";
import { canEditUserProfile } from "@/server/auth/permissions";

const roleCapabilityMatrix: ReadonlyArray<
  readonly [Role, Record<Capability, boolean>]
> = [
  [
    ROLES.IT,
    {
      VIEW_MANAGE_USERS: true,
      VIEW_ALL_USERS: true,
      VIEW_DIRECT_REPORTS: false,
      CREATE_USER: true,
      EDIT_ANY_USER_PROFILE: true,
      EDIT_DIRECT_REPORT_PROFILE: false,
      CHANGE_USER_ROLE: true,
      CHANGE_USER_STATUS: true,
      VIEW_CONTENT: false,
    },
  ],
  [
    ROLES.MANAGER,
    {
      VIEW_MANAGE_USERS: true,
      VIEW_ALL_USERS: false,
      VIEW_DIRECT_REPORTS: true,
      CREATE_USER: false,
      EDIT_ANY_USER_PROFILE: false,
      EDIT_DIRECT_REPORT_PROFILE: true,
      CHANGE_USER_ROLE: false,
      CHANGE_USER_STATUS: false,
      VIEW_CONTENT: true,
    },
  ],
  [
    ROLES.USER,
    {
      VIEW_MANAGE_USERS: false,
      VIEW_ALL_USERS: false,
      VIEW_DIRECT_REPORTS: false,
      CREATE_USER: false,
      EDIT_ANY_USER_PROFILE: false,
      EDIT_DIRECT_REPORT_PROFILE: false,
      CHANGE_USER_ROLE: false,
      CHANGE_USER_STATUS: false,
      VIEW_CONTENT: true,
    },
  ],
];

beforeEach(() => {
  resetStore();
});

describe("role capability contract", () => {
  it.each(roleCapabilityMatrix)(
    "matches the complete non-hierarchical capability matrix for %s",
    (role, expected) => {
      for (const capability of Object.values(CAPABILITIES)) {
        expect(hasCapability(role, capability)).toBe(expected[capability]);
      }
    },
  );

  it("allows managers to edit active and deactivated ordinary direct reports only", () => {
    const anna = getStore().users.get("anna")!;
    expect(canEditUserProfile(anna, getStore().users.get("olena")!)).toBe(true);
    expect(canEditUserProfile(anna, getStore().users.get("nina")!)).toBe(true);
    expect(canEditUserProfile(anna, getStore().users.get("dmytro")!)).toBe(
      false,
    );
    expect(canEditUserProfile(anna, anna)).toBe(false);
    expect(canEditUserProfile(anna, getStore().users.get("ivan")!)).toBe(false);
  });

  it("keeps the role definitions and landing surfaces complete", () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_DEFINITIONS[role]).toBeDefined();
      if (hasCapability(role, CAPABILITIES.VIEW_MANAGE_USERS)) {
        expect(
          hasCapability(role, CAPABILITIES.VIEW_ALL_USERS) ||
            hasCapability(role, CAPABILITIES.VIEW_DIRECT_REPORTS),
        ).toBe(true);
      }
      if (hasCapability(role, CAPABILITIES.EDIT_DIRECT_REPORT_PROFILE)) {
        expect(hasCapability(role, CAPABILITIES.VIEW_DIRECT_REPORTS)).toBe(
          true,
        );
      }

      const user = [...getStore().users.values()].find(
        (candidate) => candidate.role === role,
      )!;
      expect(getLandingPath(user)).toMatch(/^\/(content|manage-users)$/);
    }
  });

  it("fails loudly for a role without an application surface", () => {
    const user = {
      ...getStore().users.get("anna")!,
      role: "future-role",
    } as unknown as User;
    expect(() => getLandingPath(user)).toThrow(
      /No application landing surface/,
    );
  });
});
