import type { User } from "@/domain/user";
import { canManageUsers, canViewContent } from "./permissions";

export type LandingPath = "/content" | "/manage-users";

export function getLandingPath(user: User): LandingPath {
  if (canViewContent(user)) return "/content";
  if (canManageUsers(user)) return "/manage-users";

  return "/content";
}
