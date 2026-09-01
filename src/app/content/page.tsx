import { forbidden, redirect } from "next/navigation";
import { ClientTable } from "@/components/client-table";
import { getPageAuth } from "@/server/auth/current-user";
import { canViewContent } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const auth = await getPageAuth(canViewContent);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") forbidden();
  return <main><header className="page-heading"><p className="eyebrow">Content</p><h1>Client directory</h1><p className="muted">Review client records available to your account.</p></header><ClientTable /></main>;
}
