import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <main><div className="panel" style={{ maxWidth: 460, margin: "40px auto" }}><h1>Sign in</h1><p className="muted">Use one of the seeded accounts documented in README.</p><LoginForm /></div></main>;
}
