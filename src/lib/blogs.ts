import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { filterBlogsByAuthor, parseBlog, type Blog, type BlogSummary } from "./blog-schema";

export async function readBlogs(
  directory = path.join(process.cwd(), "public", "blogs"),
): Promise<Blog[]> {
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".json"))
    .sort();
  const blogs = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(directory, file), "utf8");
      if (Buffer.byteLength(raw) > 1024 * 1024)
        throw new Error(`Blog file is too large: ${file}`);
      return parseBlog(JSON.parse(raw));
    }),
  );
  if (new Set(blogs.map((blog) => blog.slug)).size !== blogs.length)
    throw new Error("Blog slugs must be unique.");
  return blogs.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title),
  );
}

export async function readBlog(slug: string) {
  return (await readBlogs()).find((blog) => blog.slug === slug) ?? null;
}

export async function blogSummaries(author?: string | null): Promise<BlogSummary[]> {
  return filterBlogsByAuthor(await readBlogs(), author).map((blog) => ({
    slug: blog.slug,
    title: blog.title,
    author: blog.author,
    authorUsername: blog.authorUsername,
    description: blog.description,
    coverImage: blog.coverImage,
    createdAt: blog.createdAt,
  }));
}
