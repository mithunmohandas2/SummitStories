import { strict as assert } from "assert";
import { test } from "node:test";
import { blogMetadata } from "../../src/lib/blog-metadata";
import type { Blog } from "../../src/lib/blog-schema";

const blog: Blog = {
  version: 1,
  slug: "mountain-trip",
  title: "A mountain trip",
  description: "A sunrise above the clouds",
  author: "Akhil",
  coverImage: "https://res.cloudinary.com/demo/image/upload/trip.webp",
  createdAt: "2026-10-03T00:00:00.000Z",
  publishedAt: "2026-11-05T00:00:00.000Z",
  content: [],
};
const base = new URL("https://summit-stories.vercel.app");

test("blog sharing metadata includes the exact cover, article details and canonical URL", () => {
  const metadata = blogMetadata(blog, base);
  assert.deepEqual(metadata.openGraph, {
    type: "article",
    siteName: "Summit Stories",
    url: `${base.origin}/blogs/mountain-trip`,
    title: blog.title,
    description: blog.description,
    authors: [blog.author],
    publishedTime: blog.publishedAt,
    images: [{ url: blog.coverImage, alt: blog.title }],
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: blog.title,
    description: blog.description,
    images: [{ url: blog.coverImage, alt: blog.title }],
  });
  assert.deepEqual(metadata.alternates, { canonical: `${base.origin}/blogs/mountain-trip` });
});

test("local covers resolve to public absolute URLs and missing or unsafe covers use the logo", () => {
  for (const [coverImage, expected] of [
    ["/images/trip.webp", `${base.origin}/images/trip.webp`],
    ["", `${base.origin}/images/logo.webp`],
    ["javascript:alert(1)", `${base.origin}/images/logo.webp`],
  ]) {
    const metadata = blogMetadata({ ...blog, coverImage }, base);
    assert.deepEqual(metadata.openGraph?.images, [{ url: expected, alt: blog.title }]);
  }
});
