"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BlogSummary } from "../lib/blog-schema";

function BlogDetails({ limit, author, showViewAll = false }: { limit?: number; author?: string; showViewAll?: boolean }) {
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(author ? `/api/blogs?author=${encodeURIComponent(author)}` : "/api/blogs", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Unable to load blogs. Please refresh to try again.");
        const data = await response.json();
        setBlogs(data.blogs);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Unable to load blogs.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [author]);
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
  if (!blogs.length)
    return (
      <p className="px-6 py-10 text-gray-500 dark:text-gray-400">{author ? `No stories published by ${author}.` : "No stories published yet."}</p>
    );
  const displayedBlogs = limit && limit > 0 ? blogs.slice(0, limit) : blogs;

  return (
    <>
    <div className="grid md:grid-cols-3 gap-8 px-6 py-10">
      {displayedBlogs.map((blog) => (
        <Link
          href={`/blogs/${blog.slug}`}
          key={blog.slug}
          className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition cursor-pointer"
        >
          <div
            className="h-60 bg-cover bg-center"
            style={{
              backgroundImage: blog.coverImage
                ? `url("${blog.coverImage.replace(/"/g, "%22")}")`
                : undefined,
            }}
          ></div>
          <div className="p-6 bg-white dark:bg-gray-900">
            <h4 className="text-xl font-semibold">{blog?.title}</h4>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{blog?.description}</p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-4">By {blog.author}</p>
          </div>
        </Link>
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
