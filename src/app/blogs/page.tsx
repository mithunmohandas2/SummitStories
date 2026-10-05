import type { Metadata } from "next";
import BlogDetails from "../../views/BlogDetails";
import Link from "next/link";
import { parseBlogSort } from "../../lib/blog-list-options";

export const metadata: Metadata = { title: "Blogs" };

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ author?: string | string[]; sort?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = params.author;
  const author = (Array.isArray(query) ? query[0] : query) || undefined;
  const sort = parseBlogSort(Array.isArray(params.sort) ? params.sort[0] : params.sort);
  return (
    <>
      {author && (
        <div className="max-w-7xl mx-auto px-6 pt-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold break-all">Blogs by {author}</h1>
          <Link
            href={sort === "newest" ? "/blogs" : `/blogs?sort=${sort}`}
            className="text-orange-600 dark:text-orange-400 underline cursor-pointer"
          >
            View all blogs
          </Link>
        </div>
      )}
      <BlogDetails author={author} showFilters sort={sort} />
    </>
  );
}
