import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { getLandingPath } from "@/server/auth/landing";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const auth = await getPageAuth(() => true);
  if (auth.kind === "authorized") redirect(getLandingPath(auth.user));
  return (
    <main className="login-page">
      <section className="panel login-card">
        <div className="login-brand">Access Control</div>
        <h1>Sign in</h1>
        <p className="muted">
          Use one of the seeded accounts documented in README.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
