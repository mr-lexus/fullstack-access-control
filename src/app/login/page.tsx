import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { canManageUsers } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const auth = await getPageAuth(() => true);
  if (auth.kind === "authorized") redirect(canManageUsers(auth.user) ? "/manage-users" : "/content");
  return <main className="login-page"><section className="panel login-card"><div className="login-brand">Access Control</div><h1>Sign in</h1><p className="muted">Use one of the seeded accounts documented in README.</p><LoginForm /></section></main>;
}
