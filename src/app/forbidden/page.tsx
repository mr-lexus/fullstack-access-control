import Link from "next/link";

export default function ForbiddenPage() {
  return <main className="state-page"><section className="panel state-card"><div className="error-code">403</div><h1>Access denied</h1><p className="muted">Your active account is not allowed to access this page.</p><Link className="button button-primary" href="/">Return to your section</Link></section></main>;
}
