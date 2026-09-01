import { ClientDetail } from "@/components/client-detail";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { canViewContent } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getPageAuth(canViewContent);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") forbidden();
  const { id } = await params;
  return (
    <main>
      <Link className="back-link" href="/content">
        ← Back to clients
      </Link>
      <ClientDetail id={id} />
    </main>
  );
}
