import { AppError } from "@/domain/errors";
import { CAPABILITIES, isRole, ROLES, type Role, hasCapability } from "@/domain/roles";
import { isUserStatus, type PublicUser, type UserRecord, type UserStatus } from "@/domain/user";
import { getStore } from "@/server/data/store";
import { canChangeUserRole, canChangeUserStatus, canCreateUser, canEditUserProfile, canViewUsers, can } from "@/server/auth/permissions";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type CreateUserInput = { fullName: string; email: string; password: string; role: Role; status: UserStatus; managerId: string | null };

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") throw new AppError("INVALID_INPUT", "Email is required.");
  const email = value.trim().toLowerCase();
  if (!emailPattern.test(email)) throw new AppError("INVALID_INPUT", "A valid email is required.");
  return email;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) throw new AppError("INVALID_INPUT", `${field} is required.`);
  return value.trim();
}

function getTarget(targetId: string): UserRecord {
  const target = getStore().users.get(targetId);
  if (!target) throw new AppError("USER_NOT_FOUND", "User was not found.");
  return target;
}

function assertUniqueEmail(email: string, exceptId?: string): void {
  if ([...getStore().users.values()].some((user) => user.email === email && user.id !== exceptId)) throw new AppError("EMAIL_ALREADY_EXISTS", "That email is already in use.");
}

function publicUser(user: UserRecord): PublicUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function assertAuthorized(condition: boolean): void {
  if (!condition) throw new AppError("FORBIDDEN", "You are not allowed to perform this operation.");
}

export function listUsers(actor: UserRecord): PublicUser[] {
  assertAuthorized(canViewUsers(actor));
  const users = can(actor, CAPABILITIES.VIEW_ALL_USERS)
    ? [...getStore().users.values()]
    : [...getStore().users.values()].filter((user) => user.managerId === actor.id);
  return users.map(publicUser);
}

export function createUser(actor: UserRecord, input: Record<string, unknown>): PublicUser {
  assertAuthorized(canCreateUser(actor));
  const fullName = requiredText(input.fullName, "Full name");
  const email = normalizeEmail(input.email);
  const password = requiredText(input.password, "Password");
  if (!isRole(input.role)) throw new AppError("INVALID_INPUT", "Role is invalid.");
  if (!isUserStatus(input.status)) throw new AppError("INVALID_INPUT", "Status is invalid.");
  const managerId = input.managerId === null || input.managerId === undefined ? null : requiredText(input.managerId, "Manager ID");
  if (managerId && !getStore().users.has(managerId)) throw new AppError("INVALID_INPUT", "Manager does not exist.");
  assertUniqueEmail(email);
  const user: UserRecord = { id: `user-${getStore().users.size + 1}`, fullName, email, password, role: input.role, status: input.status, managerId, createdAt: new Date().toISOString() };
  getStore().users.set(user.id, user);
  return publicUser(user);
}

export function updateUserProfile(actor: UserRecord, targetId: string, input: Record<string, unknown>): PublicUser {
  const target = getTarget(targetId);
  assertAuthorized(canEditUserProfile(actor, target));
  if (Object.keys(input).some((key) => key !== "fullName" && key !== "email")) throw new AppError("INVALID_INPUT", "Only fullName and email may be updated.");
  if (Object.keys(input).length === 0) throw new AppError("INVALID_INPUT", "At least one profile field is required.");
  const fullName = input.fullName === undefined ? target.fullName : requiredText(input.fullName, "Full name");
  const email = input.email === undefined ? target.email : normalizeEmail(input.email);
  assertUniqueEmail(email, target.id);
  target.fullName = fullName; target.email = email;
  return publicUser(target);
}

function countActiveIt(): number {
  return [...getStore().users.values()].filter((user) => user.role === ROLES.IT && user.status === "active").length;
}

export function changeUserRole(actor: UserRecord, targetId: string, roleValue: unknown): PublicUser {
  assertAuthorized(canChangeUserRole(actor));
  const target = getTarget(targetId);
  if (!isRole(roleValue)) throw new AppError("INVALID_INPUT", "Role is invalid.");
  if (target.role === ROLES.IT && target.status === "active" && roleValue !== ROLES.IT && countActiveIt() <= 1) throw new AppError("LAST_ACTIVE_IT", "The last active IT account cannot lose its IT role.");
  if (actor.id === target.id && target.role === ROLES.IT && roleValue !== ROLES.IT) throw new AppError("CANNOT_CHANGE_OWN_ROLE", "You cannot remove your own IT role.");
  target.role = roleValue;
  return publicUser(target);
}

export function changeUserStatus(actor: UserRecord, targetId: string, statusValue: unknown): PublicUser {
  assertAuthorized(canChangeUserStatus(actor));
  const target = getTarget(targetId);
  if (!isUserStatus(statusValue)) throw new AppError("INVALID_INPUT", "Status is invalid.");
  if (target.role === ROLES.IT && target.status === "active" && statusValue === "deactivated" && countActiveIt() <= 1) throw new AppError("LAST_ACTIVE_IT", "The last active IT account cannot be deactivated.");
  if (actor.id === target.id && target.status === "active" && statusValue === "deactivated") throw new AppError("CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own account.");
  target.status = statusValue;
  return publicUser(target);
}
