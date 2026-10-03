import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { authConfigured } from "../../lib/accounts";
import BlogBuilder from "../../components/builder/BlogBuilder";

export const metadata = { title: "Blog builder" };
export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  if (!authConfigured()) redirect("/login");
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return <BlogBuilder author={session.user.name ?? "Author"} username={session.user.username} />;
}
