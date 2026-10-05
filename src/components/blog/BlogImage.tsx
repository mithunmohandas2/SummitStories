"use client";

import { useState } from "react";
import type { ImageItem } from "../../lib/blog-schema";
import ImageViewer from "../gallery/ImageViewer";

export default function BlogImage({ image, blogTitle = "", blogSlug = "" }: {
  image: ImageItem;
  blogTitle?: string;
  blogSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const caption = image.caption || image.alt || blogTitle || "Blog image";
  const alt = image.alt || caption;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View image: ${caption}`}
        aria-haspopup="dialog"
        className="block w-full cursor-zoom-in rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
      >
        <img
          src={image.src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full max-h-[480px] object-cover rounded-2xl"
        />
      </button>
      {open && (
        <ImageViewer
          image={{ ...image, alt, caption, blogTitle, blogSlug }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
}
