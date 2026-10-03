"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { GalleryImage } from "../../lib/gallery";

export default function ImageViewer({
  image,
  onDismiss,
}: {
  image: GalleryImage;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const nativeFullscreen = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const captionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const updateFullscreen = () => {
      if (document.fullscreenElement === dialog) {
        nativeFullscreen.current = true;
        setExpanded(true);
      } else if (nativeFullscreen.current) {
        nativeFullscreen.current = false;
        setExpanded(false);
      }
    };
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreen);
      if (document.fullscreenElement === dialog)
        void document.exitFullscreen().catch(() => {});
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  async function toggleFullscreen() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded) {
      if (document.fullscreenElement === dialog) {
        try {
          await document.exitFullscreen();
        } catch {
          return;
        }
      }
      setExpanded(false);
      return;
    }
    // Fill the viewport even on browsers without the native Fullscreen API.
    setExpanded(true);
    try {
      await dialog.requestFullscreen?.();
    } catch {
      /* Keep the viewport-sized viewer. */
    }
  }

  const controls =
    "rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800";
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={captionId}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onDismiss();
      }}
      className={`gallery-dialog m-auto p-0 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 shadow-2xl backdrop:bg-black/80 ${expanded ? "w-screen h-[100dvh] max-w-none max-h-none rounded-none" : "w-[calc(100%_-_2rem)] max-w-6xl max-h-[calc(100dvh_-_2rem)] rounded-2xl"}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {image.blogTitle}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className={controls}
              onClick={toggleFullscreen}
            >
              {expanded ? "Exit fullscreen" : "Fullscreen"}
            </button>
            <button
              ref={closeRef}
              type="button"
              className={controls}
              onClick={onDismiss}
              aria-label="Close image viewer"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex flex-1 min-h-0 items-center justify-center bg-gray-100 dark:bg-black p-3 md:p-6">
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            className={`w-full object-contain ${expanded ? "max-h-[calc(100dvh_-_12rem)]" : "max-h-[65dvh]"}`}
          />
        </div>
        <h2
          id={captionId}
          className="px-4 md:px-6 py-4 text-base font-medium break-words"
        >
          {image.caption}
        </h2>
      </div>
    </dialog>
  );
}
