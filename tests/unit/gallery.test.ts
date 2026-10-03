import { strict as assert } from "assert";
import { test } from "node:test";
import { collectGalleryImages } from "../../src/lib/gallery";
import type { Blog } from "../../src/lib/blog-schema";

test("gallery collects cover, nested column, and carousel images with captions", () => {
  const blog: Blog = {
    version: 1,
    slug: "gallery-test",
    title: "Mountain Journey",
    author: "Writer",
    description: "",
    createdAt: "2026-10-03T00:00:00.000Z",
    coverImage: "/images/cover.jpg",
    content: [
      {
        id: "cover",
        type: "image",
        src: "/images/cover.jpg",
        alt: "Mountain summit",
        caption: "At the summit",
      },
      {
        id: "row",
        type: "row",
        columns: [
          {
            id: "column",
            content: [
              {
                id: "nested",
                type: "image",
                src: "/images/nested.jpg",
                alt: "Valley",
                caption: "",
              },
              {
                id: "carousel",
                type: "carousel",
                images: [
                  { src: "/images/slide.jpg", alt: "", caption: "Sunrise" },
                  {
                    src: "/images/cover.jpg",
                    alt: "Repeated image",
                    caption: "Repeated caption",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const images = collectGalleryImages([blog, { ...blog, slug: "other-blog" }]);
  assert.equal(images.length, 3);
  assert.deepEqual(
    images.map((image) => image.caption),
    ["At the summit", "Valley", "Sunrise"],
  );
  assert.equal(images[0].alt, "Mountain summit");
  assert.equal(images[2].alt, "Sunrise");
  assert.equal(images[0].blogSlug, "gallery-test");
});

test("empty galleries are supported and cover-only images use the blog title", () => {
  assert.deepEqual(collectGalleryImages([]), []);
  const images = collectGalleryImages([
    {
      version: 1,
      slug: "cover-only",
      title: "A journey",
      author: "Writer",
      description: "",
      createdAt: "2026-10-03T00:00:00.000Z",
      coverImage: "/images/cover.jpg",
      content: [{ id: "paragraph", type: "paragraph", text: "A travel story" }],
    },
  ]);
  assert.equal(images[0].caption, "A journey");
  assert.equal(images[0].alt, "A journey");
});
