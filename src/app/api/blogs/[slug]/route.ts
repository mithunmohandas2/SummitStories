import { readBlog } from "../../../../lib/blogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    console.error("Unable to load blog", error);
    return Response.json({ error: "Unable to load blog." }, { status: 500 });
  }
}
