import { ROLE_DEFINITIONS } from "@/domain/roles";
import type { User } from "@/domain/user";
import { canManageUsers, canViewContent } from "./permissions";

export type LandingPath = "/content" | "/manage-users";

export function getLandingPath(user: User): LandingPath {
  if (!ROLE_DEFINITIONS[user.role]) {
    throw new Error(
      `No application landing surface is configured for role ${user.role}.`,
    );
  }
  if (canViewContent(user)) return "/content";
  if (canManageUsers(user)) return "/manage-users";

  throw new Error(
    `No application landing surface is configured for role ${user.role}.`,
  );
}
