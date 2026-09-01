import { redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { canManageUsers } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auth = await getPageAuth(() => true);
  if (auth.kind === "unauthenticated") redirect("/login");
  redirect(canManageUsers(auth.user) ? "/manage-users" : "/content");
}
