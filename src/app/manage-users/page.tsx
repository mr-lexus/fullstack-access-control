import { forbidden, redirect } from "next/navigation";
import { ManageUsersPanel } from "@/components/manage-users-panel";
import { getPageAuth } from "@/server/auth/current-user";
import { canManageUsers } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ManageUsersPage() {
  const auth = await getPageAuth(canManageUsers);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") forbidden();
  return (
    <main>
      <header className="page-heading">
        <p className="eyebrow">Administration</p>
        <h1>Manage users</h1>
        <p className="muted">
          Create accounts and maintain the users available to your role.
        </p>
      </header>
      <ManageUsersPanel />
    </main>
  );
}
