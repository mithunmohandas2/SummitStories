import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { authConfigured } from "../../lib/accounts";
import LoginForm from "../../components/LoginForm";

export const metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (authConfigured() && (await getServerSession(authOptions)))
    redirect("/builder");
  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-3">Welcome back</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Log in to create your next travel story.
      </p>
      <LoginForm configured={authConfigured()} />
    </div>
  );
}
