import Link from "next/link";

export default function ForbiddenPage() {
  return <main><div className="panel"><h1>403 Forbidden</h1><p>Your active account is not allowed to access this page.</p><Link href="/">Return home</Link></div></main>;
}
