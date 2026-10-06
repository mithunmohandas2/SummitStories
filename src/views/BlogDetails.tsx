"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { filterBlogsByAuthor, type BlogSummary } from "../lib/blog-schema";
import { useErrorToast } from "../components/ToastProvider";
import BlogOwnerActions from "../components/blog/BlogOwnerActions";
import { BLOG_LIST_CHANGED_EVENT, getBlogSummaries } from "../lib/blog-list-cache";
import BlogListControls from "../components/blog/BlogListControls";
import {
  blogAuthorOptions,
  sortBlogs,
  type BlogSort,
} from "../lib/blog-list-options";

const publicationDateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function BlogDetails({
  limit,
  author,
  showViewAll = false,
  showFilters = false,
  sort = "newest",
}: {
  limit?: number;
  author?: string;
  showViewAll?: boolean;
  showFilters?: boolean;
  sort?: BlogSort;
}) {
  const showError = useErrorToast();
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let generation = 0;
    function loadBlogs() {
      const requestGeneration = ++generation;
      getBlogSummaries(showFilters ? undefined : author)
      .then((blogs) => {
        if (active && requestGeneration === generation) {
          setError("");
          setBlogs(blogs);
        }
      })
      .catch((cause: unknown) => {
        if (active && requestGeneration === generation) {
          const message =
            cause instanceof Error ? cause.message : "Unable to load blogs.";
          setError(message);
          if (message === "Database unavailable") showError(message);
        }
      })
      .finally(() => {
        if (active && requestGeneration === generation) setLoading(false);
      });
    }
    loadBlogs();
    window.addEventListener(BLOG_LIST_CHANGED_EVENT, loadBlogs);
    return () => {
      active = false;
      window.removeEventListener(BLOG_LIST_CHANGED_EVENT, loadBlogs);
    };
  }, [author, showFilters, showError]);
  if (loading)
    return (
      <p role="status" className="px-6 py-10 text-gray-500 dark:text-gray-400">
        Loading stories…
      </p>
    );
  if (error)
    return (
      <p role="alert" className="px-6 py-10 text-red-700 dark:text-red-300">
        {error}
      </p>
    );
  const matchingBlogs = sortBlogs(
    showFilters ? filterBlogsByAuthor(blogs, author) : blogs,
    sort,
  );
  const displayedBlogs =
    limit && limit > 0 ? matchingBlogs.slice(0, limit) : matchingBlogs;

  return (
    <>
      {showFilters && (
        <BlogListControls
          authors={blogAuthorOptions(blogs)}
          author={author}
          sort={sort}
          count={matchingBlogs.length}
        />
      )}
      {!matchingBlogs.length && (
        <p className="px-6 py-10 text-gray-500 dark:text-gray-400">
          {author
            ? `No stories published by ${author}.`
            : "No stories published yet."}
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-8 p-6">
        {displayedBlogs.map((blog) => (
          <article
            key={blog.slug}
            className="flex h-full min-w-0 flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg hover:scale-105 transition"
          >
            <Link href={`/blogs/${blog.slug}`} className="flex flex-1 flex-col">
              <div
                className="h-60 shrink-0 bg-cover bg-center"
                style={{
                  backgroundImage: blog.coverImage
                    ? `url("${blog.coverImage.replace(/"/g, "%22")}")`
                    : undefined,
                }}
              ></div>
              <div className="px-6 pt-6">
                <h4
                  title={blog.title}
                  className="line-clamp-2 min-h-14 text-xl font-semibold leading-7 break-words"
                >
                  {blog.title}
                </h4>
                <p
                  title={blog.description}
                  className="line-clamp-2 min-h-12 text-gray-500 dark:text-gray-400 mt-2 leading-6 break-words"
                >
                  {blog?.description}
                </p>
              </div>
            </Link>
            <footer className="mt-auto px-6 pb-6">
              <BlogOwnerActions
                slug={blog.slug}
                title={blog.title}
                authorUsername={blog.authorUsername}
              />
              <div className="mt-4">
                <p
                  title={blog.author}
                  className="truncate text-sm text-orange-600 dark:text-orange-400"
                >
                  By {blog.author}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Published{" "}
                  <time dateTime={blog.publishedAt ?? blog.createdAt}>
                    {publicationDateFormat.format(
                      new Date(blog.publishedAt ?? blog.createdAt),
                    )}
                  </time>
                </p>
              </div>
            </footer>
          </article>
        ))}
      </div>
      {showViewAll && blogs.length > 6 && (
        <div className="px-6 text-center">
          <Link
            href="/blogs"
            className="text-orange-600 dark:text-orange-400 underline cursor-pointer"
          >
            View all blogs
          </Link>
        </div>
      )}
    </>
  );
}

export default BlogDetails;
