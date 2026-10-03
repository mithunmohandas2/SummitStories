import type { Block, Blog, ImageItem } from "./blog-schema";

export type GalleryImage = ImageItem & { blogTitle: string; blogSlug: string };

export function collectGalleryImages(blogs: Blog[]): GalleryImage[] {
  const images = new Map<string, GalleryImage>();
  for (const blog of blogs) {
    const add = (image: ImageItem) => {
      if (!image.src) return;
      const existing = images.get(image.src);
      if (!existing)
        images.set(image.src, {
          ...image,
          blogTitle: blog.title,
          blogSlug: blog.slug,
        });
      else {
        if (!existing.caption && image.caption)
          existing.caption = image.caption;
        if (!existing.alt && image.alt) existing.alt = image.alt;
      }
    };
    const visit = (blocks: Block[]) => {
      for (const block of blocks) {
        if (block.type === "image") add(block);
        else if (block.type === "carousel") block.images.forEach(add);
        else if (block.type === "row")
          block.columns.forEach((column) => visit(column.content));
      }
    };
    if (blog.coverImage) add({ src: blog.coverImage, alt: "", caption: "" });
    visit(blog.content);
  }
  return Array.from(images.values(), (image) => ({
    ...image,
    alt: image.alt || image.caption || image.blogTitle,
    caption: image.caption || image.alt || image.blogTitle,
  }));
}
