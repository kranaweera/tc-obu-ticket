import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Dashboard email={String(session.email)} />;
}
