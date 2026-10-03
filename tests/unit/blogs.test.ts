import { strict as assert } from "assert";
import { test } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { readBlogs } from "../../src/lib/blogs";
import {
  parseBlog,
  safeImageUrl,
  youtubeId,
  downloadFilename,
  slugify,
  type Blog,
  filterBlogsByAuthor,
} from "../../src/lib/blog-schema";

const sample: Blog = {
  version: 1,
  slug: "test-blog",
  title: "Test blog",
  author: "Test author",
  description: "",
  coverImage: "",
  createdAt: "2026-10-03T00:00:00.000Z",
  content: [{ id: "paragraph", type: "paragraph", text: "Hello world" }],
};

test("author filters match usernames exactly without confusing display names", () => {
  const blogs = [
    {
      ...sample,
      slug: "first",
      author: "Akhil S Nair",
      authorUsername: "UNIX00001",
    },
    {
      ...sample,
      slug: "second",
      author: "Akhil S Nair",
      authorUsername: "unix00002",
    },
    { ...sample, slug: "legacy", author: "legacy-user" },
  ];
  assert.deepEqual(
    filterBlogsByAuthor(blogs, "unix00001").map((blog) => blog.slug),
    ["first"],
  );
  assert.deepEqual(filterBlogsByAuthor(blogs, "unix0000"), []);
  assert.deepEqual(filterBlogsByAuthor(blogs, "unknown"), []);
  assert.deepEqual(
    filterBlogsByAuthor(blogs, "legacy-user").map((blog) => blog.slug),
    ["legacy"],
  );
  assert.deepEqual(filterBlogsByAuthor(blogs, "Akhil S Nair"), []);
  assert.deepEqual(filterBlogsByAuthor(blogs), blogs);
  assert.deepEqual(filterBlogsByAuthor(blogs, ""), blogs);
  assert.equal(parseBlog(blogs[0]).authorUsername, "UNIX00001");
});

test("nested columns, carousels, and video blocks round-trip through JSON", () => {
  const blog: Blog = {
    ...sample,
    content: [
      {
        id: "row",
        type: "row",
        columns: [
          {
            id: "col1",
            content: [
              { id: "heading", type: "heading", text: "Subheading", level: 2 },
            ],
          },
          {
            id: "col2",
            content: [
              {
                id: "slides",
                type: "carousel",
                images: [
                  {
                    src: "https://example.com/image.jpg",
                    alt: "View",
                    caption: "Sunset",
                  },
                ],
              },
              {
                id: "video",
                type: "youtube",
                url: "https://youtu.be/dQw4w9WgXcQ",
                caption: "Video",
              },
            ],
          },
        ],
      },
    ],
  };
  assert.deepEqual(parseBlog(JSON.parse(JSON.stringify(blog))), blog);
});

test("reject invalid URLs, empty content, duplicate block IDs, and excessively nested input", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,test",
    "//evil.example/image",
    "/\\evil.example/image",
    "http://example.com/image.jpg",
  ])
    assert.equal(safeImageUrl(url), false);
  assert.equal(safeImageUrl("/images/logo.webp"), true);
  assert.equal(safeImageUrl("https://example.com/image.jpg"), true);
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10"),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    youtubeId("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ"),
    null,
  );
  assert.throws(() => parseBlog({ ...sample, content: [] }));
  assert.throws(
    () =>
      parseBlog({ ...sample, content: [sample.content[0], sample.content[0]] }),
    /unique/,
  );
  assert.throws(() =>
    parseBlog({
      ...sample,
      content: [
        {
          id: "bad",
          type: "image",
          src: "javascript:alert(1)",
          alt: "",
          caption: "",
        },
      ],
    }),
  );
  let input: unknown = {};
  for (let i = 0; i < 30; i++) input = { child: input };
  assert.throws(() => parseBlog(input), /nested/);
});

test("filenames follow blog titles and remove unsafe path characters", () => {
  assert.equal(
    downloadFilename("Journey Across Hills"),
    "Journey Across Hills.json",
  );
  assert.equal(downloadFilename("../../Hello: World?"), "....Hello World.json");
  assert.equal(downloadFilename("   "), "Untitled blog.json");
  assert.equal(
    slugify("A Misty Day in Kodaikanal!"),
    "a-misty-day-in-kodaikanal",
  );
});

test("store discovers JSON regardless of filename and rejects duplicate slugs", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "summit-stories-test-"));
  try {
    assert.deepEqual(await readBlogs(directory), []);
    await writeFile(
      path.join(directory, "Test blog.json"),
      JSON.stringify(sample),
    );
    assert.equal((await readBlogs(directory))[0].slug, "test-blog");
    await writeFile(
      path.join(directory, "another.json"),
      await readFile(path.join(directory, "Test blog.json")),
    );
    await assert.rejects(readBlogs(directory), /slugs must be unique/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
