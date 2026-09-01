import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LogoutButton } from "@/components/logout-button";
import { getPageAuth } from "@/server/auth/current-user";
import { canManageUsers, canViewContent } from "@/server/auth/permissions";

export const metadata: Metadata = { title: "Access Control Demo" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const auth = await getPageAuth(() => true);
  const isAuthenticated = auth.kind === "authorized";
  const canManage = isAuthenticated && canManageUsers(auth.user);
  const canView = isAuthenticated && canViewContent(auth.user);
  return <html lang="en"><body>{isAuthenticated && <nav className="nav"><Link href="/">Access Control</Link>{canManage && <Link href="/manage-users">Manage users</Link>}{canView && <><Link href="/content">Content</Link><Link href="/content/me">My profile</Link></>}<LogoutButton /></nav>}{children}</body></html>;
}
