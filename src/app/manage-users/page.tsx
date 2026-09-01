import { redirect } from "next/navigation";
import { ManageUsersPanel } from "@/components/manage-users-panel";
import { getPageAuth } from "@/server/auth/current-user";
import { canManageUsers } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ManageUsersPage() {
  const auth = await getPageAuth(canManageUsers);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") return <main><div className="panel"><h1>403 Forbidden</h1><p>This role cannot access user management.</p></div></main>;
  return <main><h1>Manage users</h1><p className="muted">The list is authorized and filtered by the server.</p><ManageUsersPanel /></main>;
}
