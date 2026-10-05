import { strict as assert } from "assert";
import { test } from "node:test";
import { getBlogSummaries, invalidateBlogListCache } from "../../src/lib/blog-list-cache";

test("blog requests share pending/results, separate author filters and expire after 90 seconds", async (context) => {
  invalidateBlogListCache();
  let now = 1_000;
  context.mock.method(Date, "now", () => now);
  const urls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string) => {
    urls.push(url);
    return Response.json({ blogs: [{ title: url }] });
  });
  try {
    const first = getBlogSummaries();
    assert.equal(getBlogSummaries(), first);
    await first;
    await getBlogSummaries();
    assert.deepEqual(urls, ["/api/blogs"]);
    await getBlogSummaries("writer");
    assert.deepEqual(urls, ["/api/blogs", "/api/blogs?author=writer"]);
    now += 89_999;
    await getBlogSummaries();
    assert.equal(urls.length, 2);
    now += 1;
    await getBlogSummaries();
    assert.equal(urls.length, 3);
    invalidateBlogListCache();
    await getBlogSummaries();
    assert.equal(urls.length, 4);
  } finally { invalidateBlogListCache(); }
});

test("failed blog requests can be retried and invalidated in-flight responses cannot repopulate the cache", async (context) => {
  invalidateBlogListCache();
  let calls = 0;
  let finish: (response: Response) => void = () => {};
  context.mock.method(globalThis, "fetch", () => {
    calls += 1;
    if (calls === 1) return Promise.resolve(Response.json({ error: "Database unavailable" }, { status: 503 }));
    if (calls === 2) return new Promise<Response>(resolve => { finish = resolve; });
    return Promise.resolve(Response.json({ blogs: [{ title: "Fresh" }] }));
  });
  try {
    await assert.rejects(getBlogSummaries(), /Database unavailable/);
    const pending = getBlogSummaries();
    invalidateBlogListCache();
    const fresh = getBlogSummaries();
    await fresh;
    finish(Response.json({ blogs: [{ title: "Old" }] }));
    await pending;
    assert.equal(getBlogSummaries(), fresh);
    assert.equal((await getBlogSummaries())[0].title, "Fresh");
    assert.equal(calls, 3);
  } finally { invalidateBlogListCache(); }
});
