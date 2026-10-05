import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { parseBlog } from "../../../lib/blog-schema";
import {
  blogSummaries,
  readBlogFresh,
  saveBlog,
  updateBlog,
  invalidateBlogCache,
} from "../../../lib/blogs";
import { MongoServerError } from "mongodb";
import {
  DatabaseUnavailableError,
  databaseUnavailableResponse,
} from "../../../lib/database-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return Response.json(
      {
        blogs: await blogSummaries(
          new URL(request.url).searchParams.get("author"),
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof DatabaseUnavailableError)
      return databaseUnavailableResponse();
    console.error("Unable to load blogs", error);
    return Response.json({ error: "Unable to load blogs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const username = session?.user?.username;
    if (!session?.user || !username) {
      return Response.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 1024 * 1024) {
      return Response.json(
        { error: "Keep the blog under 1 MB." },
        { status: 413 },
      );
    }

    const requested = parseBlog(JSON.parse(raw));
    const blog = parseBlog({
      ...requested,
      author: session.user.name || username,
      authorUsername: username,
    });

    const existing = await readBlogFresh(blog.slug);
    if (existing && existing.authorUsername !== username) {
      return Response.json(
        { error: "That blog URL is already used by another author." },
        { status: 409 },
      );
    }

    const saved = existing
      ? await updateBlog({ ...blog, createdAt: existing.createdAt, publishedAt: existing.publishedAt }, username)
      : await saveBlog(blog);
    if (!saved)
      return Response.json(
        { error: "This blog is no longer available to edit." },
        { status: 404 },
      );
    invalidateBlogCache();

    return Response.json(
      { blog: saved, message: existing ? "Blog updated." : "Blog published." },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof DatabaseUnavailableError)
      return databaseUnavailableResponse();
    if (error instanceof MongoServerError && error.code === 11000)
      return Response.json(
        { error: "That blog URL is already in use. Choose another title." },
        { status: 409 },
      );
    console.error("Unable to save blog", error);
    return Response.json({ error: "Unable to save blog." }, { status: 500 });
  }
}
