import type { Metadata } from "next";
import "./globals.css";
import { AppNavigation } from "@/components/app-navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { canManageUsers, canViewContent } from "@/server/auth/permissions";

export const metadata: Metadata = { title: "Access Control" };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getPageAuth(() => true);
  const isAuthenticated = auth.kind === "authorized";
  const items = isAuthenticated
    ? [
        ...(canManageUsers(auth.user)
          ? [{ href: "/manage-users", label: "Manage users" }]
          : []),
        ...(canViewContent(auth.user)
          ? [
              {
                href: "/content",
                label: "Clients",
                exact: true,
                activePrefixes: ["/content/client/"],
              },
              { href: "/content/me", label: "My profile" },
            ]
          : []),
      ]
    : [];

  return (
    <html lang="en">
      <body>
        {isAuthenticated && <AppNavigation items={items} />}
        {children}
      </body>
    </html>
  );
}
