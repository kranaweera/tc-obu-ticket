import { getSession } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getSession();
  const username = String(session?.username ?? "");
  return <Dashboard username={username} />;
}
