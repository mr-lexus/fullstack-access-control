import { ClientDetail } from "@/components/client-detail";
import { redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { canViewContent } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await getPageAuth(canViewContent);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") return <main><div className="panel"><h1>403 Forbidden</h1></div></main>;
  const { id } = await params;
  return <main><ClientDetail id={id} /></main>;
}
