"use client";

import { useEffect, useState } from "react";
import { CAPABILITIES, hasCapability, ROLES, type Role } from "@/domain/roles";
import { USER_STATUSES, type UserStatus } from "@/domain/user";
import { handleUnauthenticatedResponse } from "./handle-unauthenticated-response";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  managerId: string | null;
};

type ApiPayload = {
  users?: User[];
  user?: User;
  error?: { message: string };
};

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

function getUserManagementCapabilities(role: Role | null): UserManagementCapabilities {
  return {
    canCreateUser: role ? hasCapability(role, CAPABILITIES.CREATE_USER) : false,
    canChangeUserRole: role ? hasCapability(role, CAPABILITIES.CHANGE_USER_ROLE) : false,
    canChangeUserStatus: role ? hasCapability(role, CAPABILITIES.CHANGE_USER_STATUS) : false,
    canEditAnyUserProfile: role ? hasCapability(role, CAPABILITIES.EDIT_ANY_USER_PROFILE) : false,
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
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [newUser, setNewUser] = useState<NewUser>(initialNewUser);
  const capabilities = getUserManagementCapabilities(currentRole);

  async function load() {
    const [usersResponse, meResponse] = await Promise.all([
      fetch("/api/users", { cache: "no-store" }),
      fetch("/api/auth/me", { cache: "no-store" }),
    ]);
    if (
      handleUnauthenticatedResponse(usersResponse) ||
      handleUnauthenticatedResponse(meResponse)
    ) return;

    const payload: ApiPayload = await usersResponse.json();
    const me: ApiPayload = await meResponse.json();

    if (!usersResponse.ok) {
      setError(payload.error?.message ?? "Could not load users.");
      return;
    }
    if (!meResponse.ok || !me.user) {
      setError(me.error?.message ?? "Could not load current user.");
      return;
    }

    setUsers(payload.users ?? []);
    setCurrentRole(me.user.role);
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(id: string, body: Record<string, string>, success: string) {
    setError("");
    setMessage("");
    const endpoint = "role" in body ? "role" : "status" in body ? "status" : "profile";
    const response = await fetch(`/api/users/${id}/${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (handleUnauthenticatedResponse(response)) return;

    const payload: ApiPayload = await response.json();

    if (!response.ok) {
      setError(payload.error?.message ?? "Update failed.");
      return;
    }

    setMessage(success);
    await load();
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newUser, managerId: newUser.managerId || null }),
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
  }

  return (
    <>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {message && <p className="notice notice-success" role="status">{message}</p>}
      {capabilities.canCreateUser && (
        <form className="panel create-user-form" onSubmit={create}>
          <div className="section-heading form-heading">
            <div>
              <h2>Create user</h2>
              <p className="muted">Add an account and assign its initial access.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>Full name<input value={newUser.fullName} onChange={(event) => setNewUser({ ...newUser, fullName: event.target.value })} required /></label>
            <label>Email<input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} required /></label>
            <label>Password<input value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required /></label>
            <label>
              Role
              <select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as Role })}>
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label>Manager ID<input value={newUser.managerId} onChange={(event) => setNewUser({ ...newUser, managerId: event.target.value })} placeholder="Optional user ID" /></label>
          </div>
          <div className="form-actions"><button className="button button-primary" type="submit">Create user</button></div>
        </form>
      )}
      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>Users</h2>
            <p className="muted">{users.length} users visible to your account.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
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
  capabilities,
  update,
}: {
  user: User;
  capabilities: UserManagementCapabilities;
  update: (id: string, body: Record<string, string>, success: string) => Promise<void>;
}) {
  const [name, setName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const isActive = user.status === USER_STATUSES.ACTIVE;
  const canEditProfile =
    capabilities.canEditAnyUserProfile || capabilities.canEditDirectReportProfile;

  return (
    <tr>
      <td>
        {canEditProfile
          ? <input aria-label={`Name for ${user.fullName}`} value={name} onChange={(event) => setName(event.target.value)} />
          : user.fullName}
      </td>
      <td>
        {canEditProfile
          ? <input aria-label={`Email for ${user.fullName}`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          : user.email}
      </td>
      <td>
        {capabilities.canChangeUserRole
          ? (
              <select
                aria-label={`Role for ${user.fullName}`}
                value={user.role}
                onChange={(event) => void update(user.id, { role: event.target.value }, "Role updated.")}
              >
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            )
          : <span className="role-label">{user.role}</span>}
      </td>
      <td>
        <div className="status-action">
          <span className={isActive ? "status status-active" : "status status-inactive"}>
            {isActive ? "Active" : "Deactivated"}
          </span>
          {capabilities.canChangeUserStatus && (
            <button
              className={isActive ? "button button-danger-subtle" : "button button-secondary"}
              type="button"
              onClick={() => void update(
                user.id,
                { status: isActive ? USER_STATUSES.DEACTIVATED : USER_STATUSES.ACTIVE },
                "Status updated.",
              )}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
          )}
        </div>
      </td>
      <td className="row-actions">
        {canEditProfile && (
          <button
            className="button button-primary"
            type="button"
            onClick={() => void update(
              user.id,
              { fullName: name, email },
              "Profile updated.",
            )}
          >
            Save
          </button>
        )}
      </td>
    </tr>
  );
}
