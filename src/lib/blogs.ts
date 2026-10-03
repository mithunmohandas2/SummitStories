import {
  filterBlogsByAuthor,
  parseBlog,
  type Blog,
  type BlogSummary,
} from "./blog-schema";
import { getDatabase } from "./mongodb";

const COLLECTION = "blogs";

async function blogCollection() {
  const db = await getDatabase();
  const collection = db.collection<Blog>(COLLECTION);
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ authorUsername: 1, createdAt: -1 });
  return collection;
}

export async function readBlogs(): Promise<Blog[]> {
  const collection = await blogCollection();
  const documents = await collection
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1, title: 1 })
    .toArray();

  return documents.map((document: unknown) => parseBlog(document));
}

export async function readBlog(slug: string): Promise<Blog | null> {
  const collection = await blogCollection();
  const document = await collection.findOne(
    { slug },
    { projection: { _id: 0 } },
  );
  return document ? parseBlog(document) : null;
}

export async function saveBlog(blog: Blog): Promise<Blog> {
  const parsed = parseBlog(blog);
  const collection = await blogCollection();
  await collection.replaceOne({ slug: parsed.slug }, parsed, { upsert: true });
  return parsed;
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
  }));
}
