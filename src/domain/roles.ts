export const ROLES = {
  IT: "IT",
  MANAGER: "manager",
  USER: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const CAPABILITIES = {
  VIEW_CONTENT: "VIEW_CONTENT",
  VIEW_MANAGE_USERS: "VIEW_MANAGE_USERS",
  VIEW_ALL_USERS: "VIEW_ALL_USERS",
  VIEW_DIRECT_REPORTS: "VIEW_DIRECT_REPORTS",
  CREATE_USER: "CREATE_USER",
  EDIT_ANY_USER_PROFILE: "EDIT_ANY_USER_PROFILE",
  EDIT_DIRECT_REPORT_PROFILE: "EDIT_DIRECT_REPORT_PROFILE",
  CHANGE_USER_ROLE: "CHANGE_USER_ROLE",
  CHANGE_USER_STATUS: "CHANGE_USER_STATUS",
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export const ROLE_DEFINITIONS: Record<Role, ReadonlySet<Capability>> = {
  [ROLES.IT]: new Set([
    CAPABILITIES.VIEW_MANAGE_USERS,
    CAPABILITIES.VIEW_ALL_USERS,
    CAPABILITIES.CREATE_USER,
    CAPABILITIES.EDIT_ANY_USER_PROFILE,
    CAPABILITIES.CHANGE_USER_ROLE,
    CAPABILITIES.CHANGE_USER_STATUS,
  ]),
  [ROLES.MANAGER]: new Set([
    CAPABILITIES.VIEW_CONTENT,
    CAPABILITIES.VIEW_MANAGE_USERS,
    CAPABILITIES.VIEW_DIRECT_REPORTS,
    CAPABILITIES.EDIT_DIRECT_REPORT_PROFILE,
  ]),
  [ROLES.USER]: new Set([CAPABILITIES.VIEW_CONTENT]),
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && Object.values(ROLES).includes(value as Role);
}

export function hasCapability(role: Role, capability: Capability): boolean {
  return ROLE_DEFINITIONS[role].has(capability);
}
