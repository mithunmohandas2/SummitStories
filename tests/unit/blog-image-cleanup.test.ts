import { strict as assert } from "assert";
import { test } from "node:test";
import type { Blog } from "../../src/lib/blog-schema";
import { deleteUnsharedBlogImages } from "../../src/lib/blog-image-cleanup";
import { imageOwnerPrefix, ImageStorageError } from "../../src/lib/cloudinary";
import { cloudinaryImageAsset } from "../../src/lib/image-assets";

const delivery = (id: string, cloud = "test-cloud", transform = "v1") =>
  `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${id}.webp`;
const ownId = `${imageOwnerPrefix("writer")}12345678-1234-1234-1234-123456789abc`;
const otherId = `${imageOwnerPrefix("another-writer")}12345678-1234-1234-1234-123456789abc`;
const base: Blog = {
  version: 1,
  slug: "cleanup",
  title: "Cleanup",
  author: "Writer",
  authorUsername: "writer",
  description: "",
  coverImage: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  content: [],
};

test("cleanup includes covers, nested images, carousels and manual Cloudinary links but preserves shared and foreign assets", async (context) => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL = "cloudinary://test-key:test-secret@test-cloud";
  const deleted: string[] = [];
  context.mock.method(
    globalThis,
    "fetch",
    async (_url: string, options: RequestInit) => {
      deleted.push((options.body as FormData).get("public_id") as string);
      return Response.json({ result: "ok" });
    },
  );
  const blog: Blog = {
    ...base,
    coverImage: delivery(ownId),
    content: [
      {
        id: "image",
        type: "image",
        src: delivery("Summit%20Stories/photo"),
        alt: "",
        caption: "",
      },
      {
        id: "row",
        type: "row",
        columns: [
          {
            id: "column",
            content: [
              {
                id: "carousel",
                type: "carousel",
                images: [
                  {
                    src: delivery(
                      "Summit%20Stories/photo",
                      "test-cloud",
                      "c_limit,w_400/v2",
                    ),
                    alt: "",
                    caption: "",
                  },
                  { src: delivery("shared-photo"), alt: "", caption: "" },
                  { src: delivery(otherId), alt: "", caption: "" },
                  {
                    src: delivery("foreign-photo", "other-cloud"),
                    alt: "",
                    caption: "",
                  },
                  {
                    src: "https://example.com/image.jpg",
                    alt: "",
                    caption: "",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const otherBlog = {
    ...base,
    slug: "other-blog",
    coverImage: delivery("shared-photo", "test-cloud", "w_300/v5"),
  };
  try {
    assert.equal(
      await deleteUnsharedBlogImages(blog, [otherBlog], "writer"),
      2,
    );
    assert.deepEqual(deleted, [ownId, "Summit Stories/photo"]);
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  }
});

test("Cloudinary cleanup failure is surfaced so deletion can be stopped and retried", async (context) => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL = "cloudinary://test-key:test-secret@test-cloud";
  context.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { error: { message: 'Missing permissions (actions=["delete"])' } },
      { status: 403 },
    ),
  );
  try {
    await assert.rejects(
      deleteUnsharedBlogImages(
        { ...base, coverImage: delivery(ownId) },
        [],
        "writer",
      ),
      (error) =>
        error instanceof ImageStorageError &&
        /Missing permissions/.test(error.message),
    );
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  }
});

test("Cloudinary public IDs normalize transformations and encoded folders and reject traversal", () => {
  assert.deepEqual(
    cloudinaryImageAsset(
      "https://res.cloudinary.com/test-cloud/image/upload/c_limit,w_1200/v123/Summit%20Stories/photo.jpg",
    ),
    { cloud: "test-cloud", publicId: "Summit Stories/photo" },
  );
  assert.deepEqual(
    cloudinaryImageAsset(
      "https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto/sample",
    ),
    { cloud: "test-cloud", publicId: "sample" },
  );
  assert.deepEqual(
    cloudinaryImageAsset(
      "https://res.cloudinary.com/test-cloud/image/upload/v123/icons/logo.svg",
    ),
    { cloud: "test-cloud", publicId: "icons/logo" },
  );
  assert.equal(
    cloudinaryImageAsset(
      "https://res.cloudinary.com/test-cloud/image/upload/v1/folder/%2e%2e%2ffile.jpg",
    ),
    null,
  );
});
