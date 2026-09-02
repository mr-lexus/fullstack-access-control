"use client";

import { useEffect, useRef, useState } from "react";
import {
  CAPABILITIES,
  hasCapability,
  managesDirectReports,
  ROLES,
  type Role,
} from "@/domain/roles";
import { USER_STATUSES, type PublicUser, type UserStatus } from "@/domain/user";
import { handleUnauthenticatedResponse } from "./handle-unauthenticated-response";

type User = PublicUser;

type ApiPayload = {
  users?: User[];
  user?: User;
  error?: { code?: string; message: string };
};

type MutationResult =
  { ok: true; user: PublicUser } | { ok: false; message: string };

type MutationAction = "role" | "status" | "profile";

type NewUser = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
  managerId: string;
};

type UserManagementCapabilities = {
  canCreateUser: boolean;
  canChangeUserRole: boolean;
  canChangeUserStatus: boolean;
  canEditAnyUserProfile: boolean;
  canEditDirectReportProfile: boolean;
};

const roleOptions = Object.values(ROLES);

function getUserManagementCapabilities(
  role: Role | null,
): UserManagementCapabilities {
  return {
    canCreateUser: role ? hasCapability(role, CAPABILITIES.CREATE_USER) : false,
    canChangeUserRole: role
      ? hasCapability(role, CAPABILITIES.CHANGE_USER_ROLE)
      : false,
    canChangeUserStatus: role
      ? hasCapability(role, CAPABILITIES.CHANGE_USER_STATUS)
      : false,
    canEditAnyUserProfile: role
      ? hasCapability(role, CAPABILITIES.EDIT_ANY_USER_PROFILE)
      : false,
    canEditDirectReportProfile: role
      ? hasCapability(role, CAPABILITIES.EDIT_DIRECT_REPORT_PROFILE)
      : false,
  };
}

const initialNewUser: NewUser = {
  fullName: "",
  email: "",
  password: "password123",
  role: ROLES.USER,
  status: USER_STATUSES.ACTIVE,
  managerId: "",
};

export function ManageUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const [newUser, setNewUser] = useState<NewUser>(initialNewUser);
  const capabilities = getUserManagementCapabilities(currentUser?.role ?? null);

  async function load(): Promise<boolean> {
    try {
      const [usersResponse, meResponse] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);
      if (
        handleUnauthenticatedResponse(usersResponse) ||
        handleUnauthenticatedResponse(meResponse)
      )
        return false;

      const payload: ApiPayload = await usersResponse.json();
      const me: ApiPayload = await meResponse.json();

      if (!usersResponse.ok) {
        setError(payload.error?.message ?? "Could not load users.");
        return false;
      }
      if (!meResponse.ok || !me.user) {
        setError(me.error?.message ?? "Could not load current user.");
        return false;
      }

      setUsers(payload.users ?? []);
      setCurrentUser(me.user);
      return true;
    } catch {
      setError("Could not load users.");
      return false;
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(
    id: string,
    body: Record<string, string>,
    success: string,
  ): Promise<MutationResult> {
    setError("");
    setMessage("");
    const endpoint =
      "role" in body ? "role" : "status" in body ? "status" : "profile";
    try {
      const response = await fetch("/api/users/" + id + "/" + endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (handleUnauthenticatedResponse(response)) {
        return {
          ok: false,
          message: "Your session has expired. Please sign in again.",
        };
      }

      const payload: ApiPayload = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          message: payload.error?.message ?? "Update failed.",
        };
      }

      if (!payload.user) {
        return { ok: false, message: "Update failed." };
      }

      setMessage(success);
      await load();
      return { ok: true, user: payload.user };
    } catch {
      return {
        ok: false,
        message: "Could not complete the update. Please try again.",
      };
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingRef.current) return;

    isCreatingRef.current = true;
    setIsCreating(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          managerId: newUser.managerId || null,
        }),
      });
      if (handleUnauthenticatedResponse(response)) return;

      const payload: ApiPayload = await response.json();

      if (!response.ok) {
        setError(payload.error?.message ?? "Create failed.");
        return;
      }

      setMessage("User created.");
      setNewUser(initialNewUser);
      await load();
    } catch {
      setError("Could not create the user. Please try again.");
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }

  return (
    <>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice notice-success" role="status">
          {message}
        </p>
      )}
      {capabilities.canCreateUser && (
        <form className="panel create-user-form" onSubmit={create}>
          <div className="section-heading form-heading">
            <div>
              <h2>Create user</h2>
              <p className="muted">
                Add an account and assign its initial access.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Full name
              <input
                value={newUser.fullName}
                onChange={(event) =>
                  setNewUser({ ...newUser, fullName: event.target.value })
                }
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={newUser.email}
                onChange={(event) =>
                  setNewUser({ ...newUser, email: event.target.value })
                }
                required
              />
            </label>
            <label>
              Password
              <input
                value={newUser.password}
                onChange={(event) =>
                  setNewUser({ ...newUser, password: event.target.value })
                }
                required
              />
            </label>
            <label>
              Role
              <select
                value={newUser.role}
                onChange={(event) =>
                  setNewUser({ ...newUser, role: event.target.value as Role })
                }
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Manager ID
              <input
                value={newUser.managerId}
                onChange={(event) =>
                  setNewUser({ ...newUser, managerId: event.target.value })
                }
                placeholder="Optional user ID"
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              className="button button-primary"
              type="submit"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      )}
      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Users</h2>
            <p className="muted">
              {users.length} users visible to your account.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUserId={currentUser?.id ?? null}
                  capabilities={capabilities}
                  update={update}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function UserRow({
  user,
  currentUserId,
  capabilities,
  update,
}: {
  user: User;
  currentUserId: string | null;
  capabilities: UserManagementCapabilities;
  update: (
    id: string,
    body: Record<string, string>,
    success: string,
  ) => Promise<MutationResult>;
}) {
  const [name, setName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [pendingAction, setPendingAction] = useState<MutationAction | null>(
    null,
  );
  const pendingActionRef = useRef<MutationAction | null>(null);
  const [rowError, setRowError] = useState("");
  const isSelf = currentUserId === user.id;
  const isActive = user.status === USER_STATUSES.ACTIVE;
  const canEditProfile =
    capabilities.canEditAnyUserProfile ||
    (capabilities.canEditDirectReportProfile &&
      !managesDirectReports(user.role));
  const isRowBusy = pendingAction !== null;

  async function runUpdate(
    action: MutationAction,
    body: Record<string, string>,
    success: string,
  ) {
    if (pendingActionRef.current) return;

    pendingActionRef.current = action;
    setPendingAction(action);
    setRowError("");
    try {
      const result = await update(user.id, body, success);
      if (result.ok) {
        if (action === "profile") {
          setName(result.user.fullName);
          setEmail(result.user.email);
        }
      } else {
        setRowError(result.message);
        if (action === "profile") {
          setName(user.fullName);
          setEmail(user.email);
        }
      }
    } finally {
      pendingActionRef.current = null;
      setPendingAction(null);
    }
  }

  return (
    <tr>
      <td>
        {canEditProfile ? (
          <input
            aria-label={`Name for ${user.fullName}`}
            value={name}
            disabled={isRowBusy}
            onChange={(event) => setName(event.target.value)}
          />
        ) : (
          user.fullName
        )}
      </td>
      <td>
        {canEditProfile ? (
          <input
            aria-label={`Email for ${user.fullName}`}
            type="email"
            value={email}
            disabled={isRowBusy}
            onChange={(event) => setEmail(event.target.value)}
          />
        ) : (
          user.email
        )}
      </td>
      <td>
        {capabilities.canChangeUserRole && !isSelf ? (
          <select
            aria-label={`Role for ${user.fullName}`}
            value={user.role}
            disabled={isRowBusy}
            onChange={(event) =>
              void runUpdate(
                "role",
                { role: event.target.value },
                "Role updated.",
              )
            }
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        ) : (
          <span className="role-label">{user.role}</span>
        )}
      </td>
      <td>
        <div className="status-action">
          <span
            className={
              isActive ? "status status-active" : "status status-inactive"
            }
          >
            {isActive ? "Active" : "Deactivated"}
          </span>
          {capabilities.canChangeUserStatus && !isSelf && (
            <button
              className={
                isActive
                  ? "button button-danger-subtle"
                  : "button button-secondary"
              }
              type="button"
              disabled={isRowBusy}
              onClick={() =>
                void runUpdate(
                  "status",
                  {
                    status: isActive
                      ? USER_STATUSES.DEACTIVATED
                      : USER_STATUSES.ACTIVE,
                  },
                  "Status updated.",
                )
              }
            >
              {pendingAction === "status"
                ? "Updating..."
                : isActive
                  ? "Deactivate"
                  : "Activate"}
            </button>
          )}
        </div>
      </td>
      <td className="row-actions">
        {canEditProfile && (
          <button
            className="button button-primary"
            type="button"
            disabled={isRowBusy}
            onClick={() =>
              void runUpdate(
                "profile",
                { fullName: name, email },
                "Profile updated.",
              )
            }
          >
            {pendingAction === "profile" ? "Saving..." : "Save"}
          </button>
        )}
        {rowError && (
          <p className="notice notice-error row-feedback" role="alert">
            {rowError}
          </p>
        )}
      </td>
    </tr>
  );
}
