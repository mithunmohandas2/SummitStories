import { blogSummaries } from "../../../lib/blogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return Response.json(
      { blogs: await blogSummaries(new URL(request.url).searchParams.get("author")) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to load blogs", error);
    return Response.json({ error: "Unable to load blogs." }, { status: 500 });
  }
}
