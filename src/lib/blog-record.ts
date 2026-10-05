import { ObjectId } from "mongodb";
import { parseBlog, type Blog } from "./blog-schema";

// Older JSON imports often share a draft date. MongoDB's insertion timestamp
// supplies a publication date for legacy records without changing the database.
export function parseStoredBlog(document: unknown): Blog {
  const blog = parseBlog(document);
  const id = (document as { _id?: unknown })._id;
  return {
    ...blog,
    publishedAt: blog.publishedAt ?? (id instanceof ObjectId ? id.getTimestamp().toISOString() : blog.createdAt),
  };
}
