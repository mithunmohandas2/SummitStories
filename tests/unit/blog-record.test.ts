import { strict as assert } from "assert";
import { test } from "node:test";
import { ObjectId } from "mongodb";
import { parseStoredBlog } from "../../src/lib/blog-record";

const draft = { version: 1, slug: "story", title: "Story", author: "Writer", description: "", coverImage: "", createdAt: "2026-10-03T00:00:00.000Z", content: [{ id: "paragraph", type: "paragraph", text: "Story text" }] };

test("legacy publication dates use Mongo insertion time and do not expose database IDs", () => {
  const timestamp = Date.parse("2026-10-05T14:19:20.000Z");
  const result = parseStoredBlog({ ...draft, _id: ObjectId.createFromTime(timestamp / 1000) });
  assert.equal(result.createdAt, draft.createdAt);
  assert.equal(result.publishedAt, "2026-10-05T14:19:20.000Z");
  assert.equal("_id" in result, false);
  assert.equal(parseStoredBlog(draft).publishedAt, draft.createdAt);
});

test("an explicit publication date is preserved instead of using a replacement record's ID", () => {
  const publishedAt = "2026-10-04T10:00:00.000Z";
  assert.equal(parseStoredBlog({ ...draft, publishedAt, _id: new ObjectId() }).publishedAt, publishedAt);
});
