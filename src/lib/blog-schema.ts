import { z } from "zod";

export type ImageItem = { src: string; alt: string; caption: string };
export type Block =
  | { id: string; type: "heading"; text: string; level: 2 | 3 }
  | { id: string; type: "paragraph"; text: string }
  | ({ id: string; type: "image" } & ImageItem)
  | { id: string; type: "youtube"; url: string; caption: string }
  | { id: string; type: "carousel"; images: ImageItem[] }
  | { id: string; type: "row"; columns: { id: string; content: Block[] }[] };

export function safeImageUrl(value: string): boolean {
  if (/^\/(?!\/)/.test(value)) return !/[\\\u0000-\u001f]/.test(value);
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    let id: string | null = null;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : (url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/)?.[1] ??
            null);
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const image = z.object({
  src: z
    .string()
    .max(2048)
    .refine(safeImageUrl, "Use an HTTPS image URL or a local /images/ path."),
  alt: z.string().max(300),
  caption: z.string().max(1000),
});
const id = z.string().min(1).max(100);
const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      id,
      type: z.literal("heading"),
      text: z.string().trim().min(1).max(300),
      level: z.union([z.literal(2), z.literal(3)]),
    }),
    z.object({
      id,
      type: z.literal("paragraph"),
      text: z.string().trim().min(1).max(20000),
    }),
    image.extend({ id, type: z.literal("image") }),
    z.object({
      id,
      type: z.literal("youtube"),
      url: z
        .string()
        .max(2048)
        .refine(
          (value) => youtubeId(value) !== null,
          "Enter a valid YouTube video link.",
        ),
      caption: z.string().max(1000),
    }),
    z.object({
      id,
      type: z.literal("carousel"),
      images: z.array(image).min(1).max(20),
    }),
    z.object({
      id,
      type: z.literal("row"),
      columns: z
        .array(z.object({ id, content: z.array(blockSchema).min(1).max(100) }))
        .min(1)
        .max(3),
    }),
  ]),
);

export const blogSchema = z.object({
  version: z.literal(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(150),
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(150),
  authorUsername: z.string().min(1).max(100).optional(),
  description: z.string().max(1000),
  coverImage: z
    .string()
    .max(2048)
    .refine(
      (value) => value === "" || safeImageUrl(value),
      "Use an HTTPS image URL or a local /images/ path.",
    ),
  createdAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().optional(),
  content: z.array(blockSchema).min(1).max(100),
});
export type Blog = z.infer<typeof blogSchema>;
export type BlogSummary = Omit<Blog, "content" | "version">;

export function filterBlogsByAuthor<T extends { author: string; authorUsername?: string }>(blogs: T[], username?: string | null): T[] {
  if (!username) return blogs;
  const requestedUsername = username.toLowerCase();
  return blogs.filter(blog => (blog.authorUsername ?? blog.author).toLowerCase() === requestedUsername);
}

// Limit depth/count before recursive schema parsing, including imported JSON.
export function parseBlog(input: unknown): Blog {
  const pending: { value: unknown; depth: number }[] = [
    { value: input, depth: 0 },
  ];
  let count = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    if (++count > 10000 || depth > 25)
      throw new Error("Blog is too large or has too many nested rows.");
    if (value && typeof value === "object") {
      pending.push(
        ...Object.values(value).map((child) => ({
          value: child,
          depth: depth + 1,
        })),
      );
    }
  }
  const blog = blogSchema.parse(input);
  const ids = new Set<string>();
  const visit = (blocks: Block[], depth: number) => {
    if (depth > 3) throw new Error("Use at most three nested rows.");
    for (const block of blocks) {
      if (ids.has(block.id))
        throw new Error("Content block IDs must be unique.");
      ids.add(block.id);
      if (ids.size > 200) throw new Error("Use at most 200 content blocks.");
      if (block.type === "row")
        for (const column of block.columns) visit(column.content, depth + 1);
    }
  };
  visit(blog.content, 0);
  return blog;
}

export function slugify(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 150)
      .replace(/-+$/g, "") || "untitled-blog"
  );
}

export function downloadFilename(title: string): string {
  const name =
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .trim()
      .replace(/[. ]+$/g, "")
      .slice(0, 150) || "Untitled blog";
  return `${name}.json`;
}
