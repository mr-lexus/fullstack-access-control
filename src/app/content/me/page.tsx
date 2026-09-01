import { forbidden, redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { canViewContent } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const auth = await getPageAuth(canViewContent);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") forbidden();
  const isActive = auth.user.status === "active";
  return (
    <main>
      <header className="page-heading">
        <p className="eyebrow">Account</p>
        <h1>My profile</h1>
        <p className="muted">
          Your current account details and access assignment.
        </p>
      </header>
      <section className="panel detail-card">
        <div className="profile-heading">
          <div className="avatar" aria-hidden="true">
            {auth.user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{auth.user.fullName}</h2>
            <p className="muted">{auth.user.email}</p>
          </div>
          <span
            className={
              isActive ? "status status-active" : "status status-inactive"
            }
          >
            {isActive ? "Active" : "Deactivated"}
          </span>
        </div>
        <dl className="detail-list profile-details">
          <div>
            <dt>Full name</dt>
            <dd>{auth.user.fullName}</dd>
          </div>
          <div>
            <dt>Email address</dt>
            <dd>{auth.user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>
              <span className="role-label">{auth.user.role}</span>
            </dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{auth.user.id}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
