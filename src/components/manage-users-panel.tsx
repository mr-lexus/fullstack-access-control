"use client";

import { useEffect, useState } from "react";
import { ROLES } from "@/domain/roles";

type User = { id: string; fullName: string; email: string; role: string; status: string; managerId: string | null };
type ApiPayload = { users?: User[]; user?: User; error?: { message: string } };
type NewUser = { fullName: string; email: string; password: string; role: string; status: string; managerId: string };

export function ManageUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [isIt, setIsIt] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({ fullName: "", email: "", password: "password123", role: ROLES.USER, status: "active", managerId: "" });
  async function load() { const [usersResponse, meResponse] = await Promise.all([fetch("/api/users", { cache: "no-store" }), fetch("/api/auth/me", { cache: "no-store" })]); const payload: ApiPayload = await usersResponse.json(); const me: ApiPayload = await meResponse.json(); if (!usersResponse.ok) { setError(payload.error?.message ?? "Could not load users."); return; } setUsers(payload.users ?? []); setIsIt(me.user?.role === ROLES.IT); }
  useEffect(() => { void load(); }, []);
  async function update(id: string, body: Record<string, string>, success: string) { setError(""); setMessage(""); const endpoint = body.role ? "role" : body.status ? "status" : "profile"; const response = await fetch(`/api/users/${id}/${endpoint}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const payload: ApiPayload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "Update failed."); return; } setMessage(success); await load(); }
  async function create(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setMessage(""); const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newUser, managerId: newUser.managerId || null }) }); const payload: ApiPayload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "Create failed."); return; } setMessage("User created."); setNewUser({ fullName: "", email: "", password: "password123", role: ROLES.USER, status: "active", managerId: "" }); await load(); }
  return (
    <>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {message && <p className="notice notice-success" role="status">{message}</p>}
      {isIt && (
        <form className="panel create-user-form" onSubmit={create}>
          <div className="section-heading form-heading">
            <div>
              <h2>Create user</h2>
              <p className="muted">Add an account and assign its initial access.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>Full name<input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required /></label>
            <label>Email<input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></label>
            <label>Password<input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required /></label>
            <label>Role<select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}><option value={ROLES.USER}>{ROLES.USER}</option><option value={ROLES.MANAGER}>{ROLES.MANAGER}</option><option value={ROLES.IT}>{ROLES.IT}</option></select></label>
            <label>Manager ID<input value={newUser.managerId} onChange={(e) => setNewUser({ ...newUser, managerId: e.target.value })} placeholder="Optional user ID" /></label>
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
            <tbody>{users.map((user) => <UserRow key={user.id} user={user} isIt={isIt} update={update} />)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function UserRow({ user, isIt, update }: { user: User; isIt: boolean; update: (id: string, body: Record<string, string>, success: string) => Promise<void> }) {
  const [name, setName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const isActive = user.status === "active";

  return (
    <tr>
      <td><input aria-label={`Name for ${user.fullName}`} value={name} onChange={(e) => setName(e.target.value)} /></td>
      <td><input aria-label={`Email for ${user.fullName}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></td>
      <td>{isIt ? <select aria-label={`Role for ${user.fullName}`} value={user.role} onChange={(e) => void update(user.id, { role: e.target.value }, "Role updated.")}><option value={ROLES.IT}>{ROLES.IT}</option><option value={ROLES.MANAGER}>{ROLES.MANAGER}</option><option value={ROLES.USER}>{ROLES.USER}</option></select> : <span className="role-label">{user.role}</span>}</td>
      <td>
        <div className="status-action">
          <span className={isActive ? "status status-active" : "status status-inactive"}>{isActive ? "Active" : "Deactivated"}</span>
          {isIt && <button className={isActive ? "button button-danger-subtle" : "button button-secondary"} type="button" onClick={() => void update(user.id, { status: isActive ? "deactivated" : "active" }, "Status updated.")}>{isActive ? "Deactivate" : "Activate"}</button>}
        </div>
      </td>
      <td className="row-actions"><button className="button button-primary" type="button" onClick={() => void update(user.id, { fullName: name, email }, "Profile updated.")}>Save</button></td>
    </tr>
  );
}
