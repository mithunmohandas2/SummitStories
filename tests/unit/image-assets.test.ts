import { strict as assert } from "assert";
import { test } from "node:test";
import { blockImageUrls, managedImageAsset } from "../../src/lib/image-assets";
import {
  imageFileType,
  imageOwnerPrefix,
  uploadImage,
  destroyImage,
  ImageStorageError,
  imageSignature,
} from "../../src/lib/cloudinary";

const id = `${imageOwnerPrefix("writer")}12345678-1234-1234-1234-123456789abc`;
const url = `https://res.cloudinary.com/test-cloud/image/upload/v123/${id}.webp`;

test("only builder-managed Cloudinary image URLs are eligible for deletion", () => {
  assert.deepEqual(managedImageAsset(url), {
    cloud: "test-cloud",
    publicId: id,
  });
  assert.equal(
    managedImageAsset(url.replace("/v123/", "/c_limit,w_1200/v123/"))?.publicId,
    id,
  );
  assert.equal(
    managedImageAsset(url.replace("res.cloudinary.com", "evil.example")),
    null,
  );
  assert.equal(managedImageAsset(url.replace("https:", "http:")), null);
  assert.equal(
    managedImageAsset(
      "https://res.cloudinary.com/test-cloud/image/upload/manual-file.webp",
    ),
    null,
  );
  assert.equal(managedImageAsset("/images/hero.webp"), null);
  assert.notEqual(imageOwnerPrefix("writer"), imageOwnerPrefix("Writer"));
});

test("Cloudinary permission failures stay meaningful while credentials and signatures are redacted", async (context) => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL = "cloudinary://test-key:test-secret@test-cloud";
  context.mock.method(
    globalThis,
    "fetch",
    async (_endpoint: string, options: RequestInit) => {
      const form = options.body as FormData;
      return Response.json(
        {
          error: {
            message: `Request forbidden due to missing permissions (actions=["create"]). test-key test-secret ${form.get("signature")}`,
          },
        },
        { status: 403 },
      );
    },
  );
  try {
    await assert.rejects(
      uploadImage(
        new File(["RIFF1234WEBP"], "photo.webp", { type: "image/webp" }),
        "writer",
      ),
      (error) => {
        assert.ok(error instanceof ImageStorageError);
        assert.match(error.message, /missing permissions/);
        assert.match(error.message, /create/);
        assert.equal(error.message.includes("test-key"), false);
        assert.equal(error.message.includes("test-secret"), false);
        assert.match(error.message, /\[redacted\]/);
        return true;
      },
    );
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  }
});

test("Cloudinary network timeouts have a distinct retry message", async (context) => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL = "cloudinary://test-key:test-secret@test-cloud";
  context.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("Timed out", "TimeoutError");
  });
  try {
    await assert.rejects(
      uploadImage(
        new File(["RIFF1234WEBP"], "photo.webp", { type: "image/webp" }),
        "writer",
      ),
      (error) =>
        error instanceof ImageStorageError &&
        error.status === 504 &&
        error.message === "Cloudinary timed out. Please try again.",
    );
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  }
});

test("removing nested content finds image and carousel URLs and deduplicates them", () => {
  assert.deepEqual(
    blockImageUrls([
      { id: "image", type: "image", src: url, alt: "", caption: "" },
      {
        id: "row",
        type: "row",
        columns: [
          {
            id: "column",
            content: [
              {
                id: "slides",
                type: "carousel",
                images: [
                  { src: url, alt: "", caption: "" },
                  { src: "/images/hero.webp", alt: "", caption: "" },
                ],
              },
            ],
          },
        ],
      },
    ]),
    [url, "/images/hero.webp"],
  );
  assert.equal(
    imageFileType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  assert.equal(imageFileType(new Uint8Array([255, 216, 255])), "image/jpeg");
  assert.equal(
    imageFileType(new TextEncoder().encode("RIFF1234WEBP")),
    "image/webp",
  );
  assert.equal(imageFileType(new TextEncoder().encode("<svg></svg>")), null);
});

test("uploads are signed, optimized and namespaced; another user cannot destroy the asset", async (context) => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL = "cloudinary://test-key:test-secret@test-cloud";
  let calls = 0;
  context.mock.method(
    globalThis,
    "fetch",
    async (endpoint: string, options: RequestInit) => {
      calls += 1;
      const form = options.body as FormData;
      const publicId = form.get("public_id") as string;
      const params = Object.fromEntries(
        [...form.entries()].filter(
          ([key]) => !["file", "api_key", "signature"].includes(key),
        ),
      ) as Record<string, string>;
      assert.equal(
        form.get("signature"),
        imageSignature(params, "test-secret"),
      );
      assert.equal(endpoint.includes("test-secret"), false);
      if (endpoint.endsWith("/upload")) {
        assert.ok(publicId.startsWith(imageOwnerPrefix("writer")));
        assert.equal(form.get("format"), "webp");
        assert.equal(form.get("overwrite"), "false");
        assert.equal(form.get("asset_folder"), "Summit Stories/Builder/writer");
        return Response.json({
          public_id: publicId,
          secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${publicId}.webp`,
        });
      }
      assert.equal(form.get("invalidate"), "true");
      return Response.json({ result: "ok" });
    },
  );
  try {
    const uploaded = await uploadImage(
      new File(["RIFF1234WEBP"], "photo.webp", { type: "image/webp" }),
      "writer",
    );
    await assert.rejects(
      destroyImage(uploaded.url, "another-writer"),
      (error) => error instanceof ImageStorageError && error.status === 403,
    );
    assert.equal(calls, 1);
    await destroyImage(uploaded.url, "writer");
    assert.equal(calls, 2);
    delete process.env.CLOUDINARY_URL;
    await assert.rejects(
      uploadImage(new File(["test"], "test.webp"), "writer"),
      (error) => error instanceof ImageStorageError && error.status === 503,
    );
    assert.equal(calls, 2);
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  }
});
