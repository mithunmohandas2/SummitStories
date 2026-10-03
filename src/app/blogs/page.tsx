import type { Metadata } from "next";
import BlogDetails from "../../views/BlogDetails";
import Link from "next/link";

export const metadata: Metadata = { title: "Blogs" };

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ author?: string | string[] }>;
}) {
  const query = (await searchParams).author;
  const author = (Array.isArray(query) ? query[0] : query) || undefined;
  return (
    <>
      {author && (
        <div className="max-w-7xl mx-auto px-6 pt-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold break-all">Blogs by {author}</h1>
          <Link
            href="/blogs"
            className="text-orange-600 dark:text-orange-400 underline cursor-pointer"
          >
            View all blogs
          </Link>
        </div>
      )}
      <BlogDetails key={author ?? "all"} author={author} />
    </>
  );
}
