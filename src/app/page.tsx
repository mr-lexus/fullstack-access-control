import { redirect } from "next/navigation";
import { getPageAuth } from "@/server/auth/current-user";
import { getLandingPath } from "@/server/auth/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auth = await getPageAuth(() => true);
  if (auth.kind === "unauthenticated") redirect("/login");
  redirect(getLandingPath(auth.user));
}
