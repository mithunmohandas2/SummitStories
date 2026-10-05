import {
  readBlog,
  readBlogFresh,
  updateBlog,
  invalidateBlogCache,
  deleteBlog,
} from "../../../../lib/blogs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { parseBlog } from "../../../../lib/blog-schema";
import { ZodError } from "zod";
import {
  DatabaseUnavailableError,
  databaseUnavailableResponse,
} from "../../../../lib/database-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const username = session?.user?.username;
    if (!username) return Response.json({ error: "Authentication required." }, { status: 401 });
    const { slug } = await params;
    if (slug.length > 150 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      return Response.json({ error: "Blog not found." }, { status: 404 });
    const existing = await readBlogFresh(slug);
    if (!existing) return Response.json({ error: "Blog not found." }, { status: 404 });
    if (existing.authorUsername !== username)
      return Response.json({ error: "You can only delete your own blogs." }, { status: 403 });
    if (!await deleteBlog(slug, username))
      return Response.json({ error: "This blog is no longer available to delete." }, { status: 404 });
    invalidateBlogCache();
    return Response.json({ message: "Blog deleted successfully." });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return databaseUnavailableResponse();
    console.error("Unable to delete blog", error);
    return Response.json({ error: "Unable to delete this blog. Please try again." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const username = session?.user?.username;
    if (!username)
      return Response.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    const { slug } = await params;
    if (slug.length > 150 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      return Response.json({ error: "Blog not found." }, { status: 404 });
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 1024 * 1024)
      return Response.json(
        { error: "Keep the blog under 1 MB." },
        { status: 413 },
      );
    const existing = await readBlogFresh(slug);
    if (!existing)
      return Response.json({ error: "Blog not found." }, { status: 404 });
    if (existing.authorUsername !== username)
      return Response.json(
        { error: "You can only edit your own blogs." },
        { status: 403 },
      );
    const blog = parseBlog({
      ...JSON.parse(raw),
      slug: existing.slug,
      createdAt: existing.createdAt,
      publishedAt: existing.publishedAt,
      author: session.user.name || username,
      authorUsername: username,
    });
    const saved = await updateBlog(blog, username);
    if (!saved)
      return Response.json(
        { error: "This blog is no longer available to edit." },
        { status: 404 },
      );
    invalidateBlogCache();
    return Response.json({ blog: saved, message: "Blog updated." });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError)
      return databaseUnavailableResponse();
    if (error instanceof ZodError || error instanceof SyntaxError)
      return Response.json(
        { error: "Invalid blog content. Check your story and try again." },
        { status: 400 },
      );
    console.error("Unable to update blog", error);
    return Response.json(
      { error: "Unable to update blog. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 150)
      return Response.json({ error: "Blog not found." }, { status: 404 });
    const blog = await readBlog(slug);
    return blog
      ? Response.json(blog, { headers: { "Cache-Control": "no-store" } })
      : Response.json({ error: "Blog not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError)
      return databaseUnavailableResponse();
    console.error("Unable to load blog", error);
    return Response.json({ error: "Unable to load blog." }, { status: 500 });
  }
}
