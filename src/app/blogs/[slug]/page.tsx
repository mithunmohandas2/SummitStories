import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readBlog } from "../../../lib/blogs";
import BlogRenderer from "../../../components/blog/BlogRenderer";
import { DatabaseUnavailableError } from "../../../lib/database-errors";
import DatabaseUnavailableNotice from "../../../components/DatabaseUnavailableNotice";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const blog = await readBlog((await params).slug);
    return blog
      ? { title: blog.title, description: blog.description }
      : { title: "Blog not found" };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return { title: "Blog unavailable" };
    throw error;
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  let blog;
  try { blog = await readBlog((await params).slug); }
  catch (error) {
    if (error instanceof DatabaseUnavailableError) return <DatabaseUnavailableNotice />;
    throw error;
  }
  if (!blog) notFound();
  return <BlogRenderer blog={blog} showEdit />;
}
