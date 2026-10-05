import {
  filterBlogsByAuthor,
  parseBlog,
  type Blog,
  type BlogSummary,
} from "./blog-schema";
import { getDatabase } from "./mongodb";
import { unstable_cache, revalidateTag } from "next/cache";
import { cache } from "react";
import { createHash } from "node:crypto";
import { parseStoredBlog } from "./blog-record";

const COLLECTION = "blogs";
const BLOG_CACHE_TAG = "blogs";
// Separate cache entries for different database configurations without storing credentials.
const databaseCacheKey = createHash("sha256")
  .update(
    `${process.env.MONGODB_URI ?? ""}:${process.env.MONGODB_DB || "summitstories"}`,
  )
  .digest("hex");

async function blogCollection() {
  const db = await getDatabase();
  const collection = db.collection<Blog>(COLLECTION);
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ authorUsername: 1, createdAt: -1 });
  return collection;
}

async function readBlogsFromDatabase(): Promise<Blog[]> {
  const collection = await blogCollection();
  const documents = await collection
    .find({})
    .sort({ createdAt: -1, title: 1 })
    .toArray();

  return documents.map(parseStoredBlog);
}

// Mutations and the editor use a fresh read for ownership and current content.
export async function readBlogFresh(slug: string): Promise<Blog | null> {
  const collection = await blogCollection();
  const document = await collection.findOne({ slug });
  return document ? parseStoredBlog(document) : null;
}

// Share database results across API requests and page renders for 90 seconds.
// React cache also deduplicates metadata and content reads in the same render.
export const readBlogs = cache(
  unstable_cache(readBlogsFromDatabase, ["blog-list", databaseCacheKey], {
    tags: [BLOG_CACHE_TAG],
    revalidate: 90,
  }),
);

export const readBlog = cache(
  unstable_cache(readBlogFresh, ["blog-detail", databaseCacheKey], {
    tags: [BLOG_CACHE_TAG],
    revalidate: 90,
  }),
);

export function invalidateBlogCache() {
  revalidateTag(BLOG_CACHE_TAG, { expire: 0 });
}

export async function saveBlog(blog: Blog): Promise<Blog> {
  const parsed = parseBlog({ ...blog, publishedAt: new Date().toISOString() });
  const collection = await blogCollection();
  await collection.insertOne(parsed);
  return parsed;
}

export async function updateBlog(
  blog: Blog,
  username: string,
): Promise<Blog | null> {
  const parsed = parseBlog(blog);
  const collection = await blogCollection();
  const result = await collection.replaceOne(
    { slug: parsed.slug, authorUsername: username },
    parsed,
    { upsert: false },
  );
  return result.matchedCount === 1 ? parsed : null;
}

export async function deleteBlog(slug: string, username: string): Promise<boolean> {
  const collection = await blogCollection();
  const result = await collection.deleteOne({ slug, authorUsername: username });
  return result.deletedCount === 1;
}

export async function blogSummaries(
  author?: string | null,
): Promise<BlogSummary[]> {
  return filterBlogsByAuthor(await readBlogs(), author).map((blog) => ({
    slug: blog.slug,
    title: blog.title,
    author: blog.author,
    authorUsername: blog.authorUsername,
    description: blog.description,
    coverImage: blog.coverImage,
    createdAt: blog.createdAt,
    publishedAt: blog.publishedAt,
  }));
}
