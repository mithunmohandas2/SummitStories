import { strict as assert } from "assert";
import { test } from "node:test";
import type { BlogSummary } from "../../src/lib/blog-schema";
import { blogAuthorOptions, parseBlogSort, sortBlogs } from "../../src/lib/blog-list-options";
import { filterBlogsByAuthor } from "../../src/lib/blog-schema";

const blogs: BlogSummary[] = [
  { slug: "zebra", title: "Zebra", author: "Writer", authorUsername: "one", createdAt: "2026-01-01T00:00:00.000Z", description: "", coverImage: "" },
  { slug: "alpha", title: "alpha", author: "Writer", authorUsername: "two", createdAt: "2026-03-01T00:00:00.000Z", description: "", coverImage: "" },
  { slug: "beta", title: "Beta", author: "Writer", authorUsername: "ONE", createdAt: "2026-02-01T00:00:00.000Z", description: "", coverImage: "" },
];

test("blog sorting supports both date and title directions without mutating cached results", () => {
  const slugs = (sort: Parameters<typeof sortBlogs>[1]) => sortBlogs(blogs, sort).map(blog => blog.slug);
  assert.deepEqual(slugs("newest"), ["alpha", "beta", "zebra"]);
  assert.deepEqual(slugs("oldest"), ["zebra", "beta", "alpha"]);
  assert.deepEqual(slugs("title-asc"), ["alpha", "beta", "zebra"]);
  assert.deepEqual(slugs("title-desc"), ["zebra", "beta", "alpha"]);
  assert.deepEqual(blogs.map(blog => blog.slug), ["zebra", "alpha", "beta"]);
  assert.equal(parseBlogSort("unknown"), "newest");
});

test("authors with the same display name remain distinct and sorting works within a filter", () => {
  assert.deepEqual(blogAuthorOptions(blogs), [
    { value: "one", label: "Writer (@one)" },
    { value: "two", label: "Writer (@two)" },
  ]);
  assert.deepEqual(sortBlogs(filterBlogsByAuthor(blogs, "one"), "title-asc").map(blog => blog.slug), ["beta", "zebra"]);
  assert.deepEqual(filterBlogsByAuthor(blogs, "missing"), []);
  assert.deepEqual(blogAuthorOptions([{ ...blogs[0], authorUsername: undefined }]), [{ value: "Writer", label: "Writer" }]);
});

test("date sorting uses publication time when imported blogs share the same draft date", () => {
  const imported = [
    { ...blogs[0], createdAt: "2026-10-03T00:00:00.000Z", publishedAt: "2026-10-03T18:14:45.000Z" },
    { ...blogs[1], createdAt: "2026-10-03T00:00:00.000Z", publishedAt: "2026-10-05T14:19:20.000Z" },
  ];
  assert.deepEqual(sortBlogs(imported, "newest").map(blog => blog.slug), ["alpha", "zebra"]);
  assert.deepEqual(sortBlogs(imported, "oldest").map(blog => blog.slug), ["zebra", "alpha"]);
});
