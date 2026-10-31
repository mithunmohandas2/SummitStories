import { createHash, randomUUID } from "node:crypto";
import { cloudinaryImageAsset, managedImageAsset } from "./image-assets";

export class ImageStorageError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

function configuration() {
  try {
    const url = new URL(process.env.CLOUDINARY_URL ?? "");
    if (
      url.protocol !== "cloudinary:" ||
      !url.username ||
      !url.password ||
      !/^[a-zA-Z0-9_-]+$/.test(url.hostname)
    )
      throw new Error();
    return {
      cloud: url.hostname,
      apiKey: decodeURIComponent(url.username),
      secret: decodeURIComponent(url.password),
    };
  } catch {
    throw new ImageStorageError(
      "Image uploads are unavailable. Check CLOUDINARY_URL on the server.",
      503,
    );
  }
}

export function imageOwnerPrefix(username: string) {
  return `summit-stories/users/${createHash("sha256").update(username).digest("hex").slice(0, 32)}/`;
}

export function imageSignature(
  parameters: Record<string, string>,
  secret: string,
) {
  const value = Object.keys(parameters)
    .sort()
    .map((key) => `${key}=${parameters[key]}`)
    .join("&");
  return createHash("sha1")
    .update(value + secret)
    .digest("hex");
}

async function cloudinaryRequest(
  action: "upload" | "destroy",
  parameters: Record<string, string>,
  file?: File,
) {
  const config = configuration();
  const signed = {
    ...parameters,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const form = new FormData();
  Object.entries(signed).forEach(([key, value]) => form.set(key, value));
  form.set("api_key", config.apiKey);
  const signature = imageSignature(signed, config.secret);
  form.set("signature", signature);
  if (file) form.set("file", file);
  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud}/image/${action}`,
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      },
    );
  } catch (cause) {
    const timedOut =
      cause instanceof Error &&
      ["TimeoutError", "AbortError"].includes(cause.name);
    throw new ImageStorageError(
      timedOut
        ? "Cloudinary timed out. Please try again."
        : "Cannot reach Cloudinary. Check the server's network connection.",
      timedOut ? 504 : 502,
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ImageStorageError(
      "Cloudinary returned an unreadable response. Please try again.",
    );
  }
  if (!response.ok) {
    let detail =
      typeof result?.error?.message === "string"
        ? result.error.message
        : "The request was rejected. Please try again.";
    for (const sensitive of [
      config.apiKey,
      config.secret,
      signature,
      process.env.CLOUDINARY_URL,
    ]) {
      if (sensitive) detail = detail.replaceAll(sensitive, "[redacted]");
    }
    detail = detail
      .replace(/cloudinary:\/\/\S+/gi, "[redacted]")
      .replace(/\s+/g, " ")
      .slice(0, 300);
    throw new ImageStorageError(
      `Cloudinary ${action === "upload" ? "upload" : "deletion"} failed: ${detail}`,
      response.status === 429 ? 429 : 502,
    );
  }
  return result;
}

export async function uploadImage(file: File, username: string) {
  const config = configuration();
  const publicId = `${imageOwnerPrefix(username)}${randomUUID()}`;
  const result = await cloudinaryRequest(
    "upload",
    {
      public_id: publicId,
      asset_folder: `Summit Stories/Builder/${username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60)}`,
      overwrite: "false",
      format: "webp",
      transformation: "c_limit,h_1200,w_1200/q_auto:good",
    },
    file,
  );
  const asset =
    typeof result.secure_url === "string"
      ? managedImageAsset(result.secure_url)
      : null;
  if (
    result.public_id !== publicId ||
    asset?.cloud !== config.cloud ||
    asset.publicId !== publicId
  )
    throw new ImageStorageError(
      "Cloudinary returned an invalid image. Please try again.",
    );
  return {
    url: result.secure_url as string,
    publicId,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export async function destroyImage(src: string, username: string) {
  const asset = managedImageAsset(src);
  if (!asset)
    throw new ImageStorageError(
      "This image is an external link and cannot be deleted here.",
      400,
    );
  const config = configuration();
  if (
    asset.cloud !== config.cloud ||
    !asset.publicId.startsWith(imageOwnerPrefix(username))
  )
    throw new ImageStorageError(
      "You can only delete images uploaded by your account.",
      403,
    );
  await destroyPublicImage(asset.publicId);
}

async function destroyPublicImage(publicId: string) {
  const result = await cloudinaryRequest("destroy", {
    public_id: publicId,
    invalidate: "true",
  });
  if (result.result !== "ok" && result.result !== "not found")
    throw new ImageStorageError(
      "Unable to delete the image. Please try again.",
    );
}

// Used only after blog ownership and other blogs' references have been checked.
// Legacy manually pasted Cloudinary images are included for whole-blog cleanup.
export function blogImageCanBeDeleted(src: string, username: string): boolean {
  const asset = cloudinaryImageAsset(src);
  if (!asset) return false;
  const config = configuration();
  if (asset.cloud !== config.cloud) return false;
  return (
    !asset.publicId.startsWith("summit-stories/users/") ||
    asset.publicId.startsWith(imageOwnerPrefix(username))
  );
}

export async function destroyBlogImage(src: string, username: string) {
  if (!blogImageCanBeDeleted(src, username))
    throw new ImageStorageError(
      "This image cannot be deleted by your account.",
      403,
    );
  await destroyPublicImage(cloudinaryImageAsset(src)!.publicId);
}

export function imageFileType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
