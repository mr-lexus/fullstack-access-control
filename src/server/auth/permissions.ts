import { CAPABILITIES, hasCapability, type Capability } from "@/domain/roles";
import type { User } from "@/domain/user";

export function can(actor: User, capability: Capability): boolean {
  return hasCapability(actor.role, capability);
}

export function canViewContent(actor: User): boolean {
  return can(actor, CAPABILITIES.VIEW_CONTENT);
}

export function canManageUsers(actor: User): boolean {
  return can(actor, CAPABILITIES.VIEW_MANAGE_USERS);
}

export function canCreateUser(actor: User): boolean {
  return can(actor, CAPABILITIES.CREATE_USER);
}

export function canViewUsers(actor: User): boolean {
  return can(actor, CAPABILITIES.VIEW_ALL_USERS) || can(actor, CAPABILITIES.VIEW_DIRECT_REPORTS);
}

export function canEditUserProfile(actor: User, target: User): boolean {
  return can(actor, CAPABILITIES.EDIT_ANY_USER_PROFILE) ||
    (can(actor, CAPABILITIES.EDIT_DIRECT_REPORT_PROFILE) && target.managerId === actor.id);
}

export function canChangeUserRole(actor: User): boolean {
  return can(actor, CAPABILITIES.CHANGE_USER_ROLE);
}

export function canChangeUserStatus(actor: User): boolean {
  return can(actor, CAPABILITIES.CHANGE_USER_STATUS);
}

export function canReadClients(actor: User): boolean {
  return can(actor, CAPABILITIES.VIEW_CONTENT);
}
