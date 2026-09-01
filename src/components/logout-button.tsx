"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }
  return <form action={logout}><button className="secondary" type="submit">Log out</button></form>;
}
