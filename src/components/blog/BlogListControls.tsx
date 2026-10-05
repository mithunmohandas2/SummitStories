"use client";

import { useRouter } from "next/navigation";
import { blogSortOptions, type BlogSort } from "../../lib/blog-list-options";

export default function BlogListControls({
  authors,
  author,
  sort,
  count,
}: {
  authors: { value: string; label: string }[];
  author?: string;
  sort: BlogSort;
  count: number;
}) {
  const router = useRouter();
  const selected = authors.find(
    (option) => option.value.toLowerCase() === author?.toLowerCase(),
  );
  const field =
    "mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100";

  function change(key: "author" | "sort", value: string) {
    const query = new URLSearchParams(window.location.search);
    if (!value || (key === "sort" && value === "newest")) query.delete(key);
    else query.set(key, value);
    router.push(`/blogs${query.size ? `?${query.toString()}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <div className="px-6 pt-1 flex flex-wrap items-end gap-4">
      <label className="text-sm font-medium w-full sm:w-64">
        Filter by author
        <select
          value={selected?.value ?? author ?? ""}
          onChange={(event) => change("author", event.target.value)}
          className={field}
        >
          <option value="">All authors</option>
          {author && !selected && <option value={author}>{author}</option>}
          {authors.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium w-full sm:w-56">
        Sort by
        <select
          value={sort}
          onChange={(event) => change("sort", event.target.value)}
          className={field}
        >
          {blogSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <p
        role="status"
        className="pb-2 text-sm text-gray-600 dark:text-gray-400"
      >
        {count} {count === 1 ? "blog" : "blogs"}
      </p>
    </div>
  );
}
