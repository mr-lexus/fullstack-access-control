export type ErrorCode =
  | "UNAUTHENTICATED"
  | "ACCOUNT_DEACTIVATED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "INTERNAL_ERROR"
  | "USER_NOT_FOUND"
  | "CLIENT_NOT_FOUND"
  | "EMAIL_ALREADY_EXISTS"
  | "CANNOT_DEACTIVATE_SELF"
  | "CANNOT_CHANGE_OWN_ROLE"
  | "LAST_ACTIVE_IT";

const DEFAULT_STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  ACCOUNT_DEACTIVATED: 403,
  FORBIDDEN: 403,
  INVALID_INPUT: 400,
  INTERNAL_ERROR: 500,
  USER_NOT_FOUND: 404,
  CLIENT_NOT_FOUND: 404,
  EMAIL_ALREADY_EXISTS: 409,
  CANNOT_DEACTIVATE_SELF: 403,
  CANNOT_CHANGE_OWN_ROLE: 403,
  LAST_ACTIVE_IT: 409,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string, status = DEFAULT_STATUS[code]) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
