"use client";

import { useState } from "react";
import type { GalleryImage } from "../../lib/gallery";
import ImageViewer from "./ImageViewer";

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [selected, setSelected] = useState<GalleryImage | null>(null);
  if (!images.length)
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No images published yet. Images will appear here when blogs are added.
      </p>
    );
  return (
    <>
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        aria-label="Blog image gallery"
      >
        {images.map((image) => (
          <figure key={image.src} className="min-w-0">
            <button
              type="button"
              onClick={() => setSelected(image)}
              aria-label={`View image: ${image.caption}`}
              className="block w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover hover:scale-105 transition-transform"
              />
            </button>
            <figcaption className="mt-3 text-sm text-gray-700 dark:text-gray-300 break-words">
              {image.caption}
            </figcaption>
          </figure>
        ))}
      </div>
      {selected && (
        <ImageViewer image={selected} onDismiss={() => setSelected(null)} />
      )}
    </>
  );
}
