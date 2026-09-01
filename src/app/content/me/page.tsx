import { forbidden, redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { canViewContent } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const auth = await getPageAuth(canViewContent);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") forbidden();
  return <main><div className="panel"><h1>My profile</h1><dl><dt>Name</dt><dd>{auth.user.fullName}</dd><dt>Email</dt><dd>{auth.user.email}</dd><dt>Role</dt><dd>{auth.user.role}</dd><dt>Status</dt><dd>{auth.user.status}</dd></dl></div></main>;
}
