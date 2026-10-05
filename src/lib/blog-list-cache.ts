import type { BlogSummary } from "./blog-schema";

const CACHE_DURATION_MS = 90_000;
export const BLOG_LIST_CHANGED_EVENT = "summit-stories:blogs-changed";
type Entry = { promise: Promise<BlogSummary[]>; expiresAt: number };
const entries = new Map<string, Entry>();

// This cache belongs to the current browser session. Identical requests also
// share a pending promise, including React's development effect remounts.
export function getBlogSummaries(author?: string): Promise<BlogSummary[]> {
  const url = author ? `/api/blogs?author=${encodeURIComponent(author)}` : "/api/blogs";
  const cached = entries.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = fetch(url)
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load blogs. Please refresh to try again.");
      if (!Array.isArray(data.blogs)) throw new Error("Unable to load blogs. Please refresh to try again.");
      // A publish may have invalidated this request while it was in flight.
      if (entries.get(url) === entry) entry.expiresAt = Date.now() + CACHE_DURATION_MS;
      return data.blogs as BlogSummary[];
    })
    .catch((error: unknown) => {
      if (entries.get(url) === entry) entries.delete(url);
      throw error;
    });
  const entry: Entry = { promise, expiresAt: Infinity };
  // Bound memory when visiting many different author filters.
  if (entries.size >= 50) entries.delete(entries.keys().next().value!);
  entries.set(url, entry);
  return promise;
}

export function invalidateBlogListCache() {
  entries.clear();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(BLOG_LIST_CHANGED_EVENT));
}
