"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }
  return <form action={logout} className="logout-form"><button className="button button-ghost" type="submit">Log out</button></form>;
}
