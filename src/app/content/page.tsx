import { forbidden, redirect } from "next/navigation";
import { ClientTable } from "@/components/client-table";
import { getPageAuth } from "@/server/auth/current-user";
import { canViewContent } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const auth = await getPageAuth(canViewContent);
  if (auth.kind === "unauthenticated") redirect("/login");
  if (auth.kind === "forbidden") forbidden();
  return <main><h1>Client content</h1><p className="muted">Only one server-paginated page is requested at a time.</p><ClientTable /></main>;
}
