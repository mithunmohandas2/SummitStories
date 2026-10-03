"use client";

import { useState } from "react";
import { safeImageUrl, type ImageItem } from "../../lib/blog-schema";

export default function Carousel({ images }: { images: ImageItem[] }) {
  const [index, setIndex] = useState(0);
  const selected = Math.min(index, Math.max(0, images.length - 1));
  const image = images[selected];
  if (!image)
    return (
      <p className="rounded-xl bg-gray-100 dark:bg-gray-800 p-8 text-gray-500 dark:text-gray-400">
        Add carousel images.
      </p>
    );
  return (
    <figure
      className="space-y-3"
      aria-roledescription="carousel"
      aria-label="Image carousel"
    >
      {safeImageUrl(image.src) ? (
        <img
          src={image.src}
          alt={image.alt}
          className="w-full max-h-[480px] object-cover rounded-2xl"
        />
      ) : (
        <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-8">Add a valid image URL.</div>
      )}
      {image.caption && (
        <figcaption className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {image.caption}
        </figcaption>
      )}
      <div className="flex justify-center items-center gap-4">
        <button
          type="button"
          aria-label="Previous image"
          disabled={images.length < 2}
          onClick={() =>
            setIndex((selected - 1 + images.length) % images.length)
          }
          className="border rounded-full px-4 py-2 disabled:opacity-40"
        >
          ←
        </button>
        <span aria-live="polite" className="text-sm">
          {selected + 1} / {images.length}
        </span>
        <button
          type="button"
          aria-label="Next image"
          disabled={images.length < 2}
          onClick={() => setIndex((selected + 1) % images.length)}
          className="border rounded-full px-4 py-2 disabled:opacity-40"
        >
          →
        </button>
      </div>
    </figure>
  );
}
