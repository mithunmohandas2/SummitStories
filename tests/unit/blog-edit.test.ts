import { strict as assert } from "assert";
import { test } from "node:test";
import { MongoClient, type Db } from "mongodb";
import { saveBlog, updateBlog, deleteBlog } from "../../src/lib/blogs";
import type { Blog } from "../../src/lib/blog-schema";

test("updates replace only an existing blog belonging to the authenticated username", async (context) => {
  const original: Blog = {
    version: 1, slug: "original-story", title: "Original story",
    author: "Writer", authorUsername: "writer", description: "", coverImage: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    content: [{ id: "paragraph", type: "paragraph", text: "Original content" }],
  };
  let stored: Blog = original;
  let inserts = 0;
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  const cache = globalThis as typeof globalThis & { mongoClientPromise?: Promise<MongoClient> };
  const previous = cache.mongoClientPromise;
  context.mock.method(client, "db", () => ({
    collection: () => ({
      createIndex: async () => "test-index",
      replaceOne: async (filter: { slug: string; authorUsername: string }, replacement: Blog, options: { upsert: boolean }) => {
        assert.equal(options.upsert, false);
        if (filter.slug !== stored.slug || filter.authorUsername !== stored.authorUsername) return { matchedCount: 0 };
        stored = replacement;
        return { matchedCount: 1 };
      },
      insertOne: async () => { inserts += 1; },
    }),
  }) as unknown as Db);
  cache.mongoClientPromise = Promise.resolve(client);
  try {
    const changed = { ...original, title: "Renamed story", content: [{ id: "paragraph", type: "paragraph" as const, text: "Updated content" }] };
    assert.equal(await updateBlog(changed, "another-user"), null);
    assert.equal(stored.title, "Original story");
    assert.deepEqual(await updateBlog(changed, "writer"), changed);
    assert.equal(stored.slug, original.slug);
    assert.equal(stored.createdAt, original.createdAt);
    assert.equal(await updateBlog({ ...changed, slug: "missing-story" }, "writer"), null);
    assert.equal(inserts, 0);
    await saveBlog({ ...original, slug: "new-story" });
    assert.equal(inserts, 1);
  } finally {
    cache.mongoClientPromise = previous;
    await client.close();
  }
});

test("deletion matches both slug and owner and does not remove another user's blog", async (context) => {
  let exists = true;
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  const cache = globalThis as typeof globalThis & { mongoClientPromise?: Promise<MongoClient> };
  const previous = cache.mongoClientPromise;
  context.mock.method(client, "db", () => ({
    collection: () => ({
      createIndex: async () => "test-index",
      deleteOne: async (filter: { slug: string; authorUsername: string }) => {
        if (!exists || filter.slug !== "owned-story" || filter.authorUsername !== "owner") return { deletedCount: 0 };
        exists = false;
        return { deletedCount: 1 };
      },
    }),
  }) as unknown as Db);
  cache.mongoClientPromise = Promise.resolve(client);
  try {
    assert.equal(await deleteBlog("owned-story", "another-user"), false);
    assert.equal(exists, true);
    assert.equal(await deleteBlog("missing-story", "owner"), false);
    assert.equal(exists, true);
    assert.equal(await deleteBlog("owned-story", "owner"), true);
    assert.equal(exists, false);
    assert.equal(await deleteBlog("owned-story", "owner"), false);
  } finally {
    cache.mongoClientPromise = previous;
    await client.close();
  }
});
