import type { BlogSummary } from "./blog-schema";

export const blogSortOptions = [
  { value: "newest", label: "Published: newest first" },
  { value: "oldest", label: "Published: oldest first" },
  { value: "title-asc", label: "Title: A–Z" },
  { value: "title-desc", label: "Title: Z–A" },
] as const;
export type BlogSort = (typeof blogSortOptions)[number]["value"];
const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export function parseBlogSort(value: unknown): BlogSort {
  return blogSortOptions.find(option => option.value === value)?.value ?? "newest";
}

export function sortBlogs(blogs: BlogSummary[], sort: BlogSort): BlogSummary[] {
  return [...blogs].sort((a, b) => {
    const titleOrder = collator.compare(a.title, b.title);
    if (sort === "title-asc") return titleOrder || collator.compare(a.slug, b.slug);
    if (sort === "title-desc") return -titleOrder || collator.compare(a.slug, b.slug);
    const dateOrder = Date.parse(a.publishedAt ?? a.createdAt) - Date.parse(b.publishedAt ?? b.createdAt);
    return (sort === "oldest" ? dateOrder : -dateOrder) || titleOrder || collator.compare(a.slug, b.slug);
  });
}

export function blogAuthorOptions(blogs: BlogSummary[]) {
  const authors = new Map<string, { value: string; label: string }>();
  for (const blog of blogs) {
    const value = blog.authorUsername ?? blog.author;
    const key = value.toLowerCase();
    if (!authors.has(key)) authors.set(key, {
      value,
      label: blog.authorUsername ? `${blog.author} (@${blog.authorUsername})` : blog.author,
    });
  }
  return [...authors.values()].sort((a, b) => collator.compare(a.label, b.label));
}
