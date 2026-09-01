import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LogoutButton } from "@/components/logout-button";

export const metadata: Metadata = { title: "Access Control Demo" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><nav className="nav"><Link href="/">Access Control</Link><Link href="/manage-users">Manage users</Link><Link href="/content">Content</Link><Link href="/content/me">My profile</Link><LogoutButton /></nav>{children}</body></html>;
}
