import type { Blog } from "./blog-schema";
import { blogImageUrls, cloudinaryImageAsset } from "./image-assets";
import { blogImageCanBeDeleted, destroyBlogImage } from "./cloudinary";

function assetKey(url: string) {
  const asset = cloudinaryImageAsset(url);
  return asset ? `${asset.cloud}/${asset.publicId}` : null;
}

export async function deleteUnsharedBlogImages(
  blog: Blog,
  otherBlogs: Blog[],
  username: string,
) {
  const referenced = new Set(
    otherBlogs
      .flatMap((other) => blogImageUrls(other).map(assetKey))
      .filter(Boolean),
  );
  const assets = new Map<string, string>();
  for (const url of blogImageUrls(blog)) {
    const key = assetKey(url);
    if (key && !referenced.has(key) && blogImageCanBeDeleted(url, username))
      assets.set(key, url);
  }
  // Serial, idempotent deletion allows retrying if Cloudinary rejects a request.
  for (const url of assets.values()) await destroyBlogImage(url, username);
  return assets.size;
}
