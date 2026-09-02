"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

type NavigationItem = {
  href: string;
  label: string;
  exact?: boolean;
  activePrefixes?: string[];
};

export function AppNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="app-header">
      <nav className="nav" aria-label="Primary navigation">
        <span className="brand">Access Control</span>
        <div className="nav-links">
          {items.map((item) => {
            const isActive = item.exact
              ? pathname === item.href ||
                item.activePrefixes?.some((prefix) =>
                  pathname.startsWith(prefix),
                )
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={isActive ? "nav-link active" : "nav-link"}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <LogoutButton />
      </nav>
    </header>
  );
}
