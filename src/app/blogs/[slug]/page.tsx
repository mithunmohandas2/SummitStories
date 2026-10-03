import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readBlog } from "../../../lib/blogs";
import BlogRenderer from "../../../components/blog/BlogRenderer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const blog = await readBlog((await params).slug);
  return blog
    ? { title: blog.title, description: blog.description }
    : { title: "Blog not found" };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const blog = await readBlog((await params).slug);
  if (!blog) notFound();
  return <BlogRenderer blog={blog} />;
}
