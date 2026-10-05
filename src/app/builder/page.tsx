import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { authConfigured } from "../../lib/accounts";
import BlogBuilder from "../../components/builder/BlogBuilder";
import { readBlogFresh } from "../../lib/blogs";
import { DatabaseUnavailableError } from "../../lib/database-errors";
import DatabaseUnavailableNotice from "../../components/DatabaseUnavailableNotice";

export const metadata = { title: "Blog builder" };
export const dynamic = "force-dynamic";

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  if (!authConfigured()) redirect("/login");
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { edit } = await searchParams;
  let initialBlog;
  if (edit !== undefined) {
    if (
      typeof edit !== "string" ||
      edit.length > 150 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(edit)
    )
      notFound();
    try {
      initialBlog = await readBlogFresh(edit);
    } catch (error) {
      if (error instanceof DatabaseUnavailableError)
        return <DatabaseUnavailableNotice />;
      throw error;
    }
    if (!initialBlog) notFound();
    if (initialBlog.authorUsername !== session.user.username) {
      return (
        <p role="alert" className="max-w-7xl mx-auto px-6 py-12">
          You can only edit your own blogs.
        </p>
      );
    }
  }
  return (
    <BlogBuilder
      key={initialBlog?.slug ?? "new"}
      initialBlog={initialBlog}
      author={session.user.name ?? "Author"}
      username={session.user.username}
    />
  );
}
