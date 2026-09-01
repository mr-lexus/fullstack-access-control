import type { Role } from "./roles";

export const USER_STATUSES = {
  ACTIVE: "active",
  DEACTIVATED: "deactivated",
} as const;

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  managerId: string | null;
  createdAt: string;
};

export type UserRecord = User & {
  password: string;
};

export type PublicUser = User;

export function isUserStatus(value: unknown): value is UserStatus {
  return value === USER_STATUSES.ACTIVE || value === USER_STATUSES.DEACTIVATED;
}
