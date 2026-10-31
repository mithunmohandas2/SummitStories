import type { Block, Blog } from "./blog-schema";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_ORIGINAL_IMAGE_BYTES = 20 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function cloudinaryImageAsset(
  src: string,
): { cloud: string; publicId: string } | null {
  try {
    const url = new URL(src);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com" ||
      url.username ||
      url.password
    )
      return null;
    const match = url.pathname.match(/^\/([^/]+)\/image\/upload\/(.+)$/);
    if (!match) return null;
    let segments = match[2]
      .split("/")
      .flatMap((segment) => decodeURIComponent(segment).split("/"));
    if (
      segments.some(
        (segment) =>
          !segment ||
          segment === "." ||
          segment === ".." ||
          /[\\\u0000-\u001f]/.test(segment),
      )
    )
      return null;
    const version = segments.findIndex((segment) => /^v\d+$/.test(segment));
    if (version >= 0) segments = segments.slice(version + 1);
    else
      while (segments.length > 1 && /^(?:[a-z]{1,3}_|\$)/.test(segments[0]))
        segments.shift();
    if (!segments.length) return null;
    const publicId = segments
      .join("/")
      .replace(
        /\.(?:webp|png|jpe?g|jpe|gif|avif|heic|heif|bmp|tiff?|jxl|svg|ico|psd|eps|jp2)$/i,
        "",
      );
    return publicId ? { cloud: match[1], publicId } : null;
  } catch {
    return null;
  }
}

// Standalone builder removals can only destroy files uploaded by that user.
export function managedImageAsset(
  src: string,
): { cloud: string; publicId: string } | null {
  const asset = cloudinaryImageAsset(src);
  return asset &&
    /^summit-stories\/users\/[a-f0-9]{32}\/[a-f0-9-]{36}$/.test(asset.publicId)
    ? asset
    : null;
}

export function blockImageUrls(blocks: Block[]): string[] {
  const urls = new Set<string>();
  const visit = (items: Block[]) =>
    items.forEach((block) => {
      if (block.type === "image" && block.src) urls.add(block.src);
      if (block.type === "carousel")
        block.images.forEach((image) => {
          if (image.src) urls.add(image.src);
        });
      if (block.type === "row")
        block.columns.forEach((column) => visit(column.content));
    });
  visit(blocks);
  return [...urls];
}

export function blogImageUrls(blog: Blog): string[] {
  return [
    ...new Set(
      [blog.coverImage, ...blockImageUrls(blog.content)].filter(Boolean),
    ),
  ];
}
