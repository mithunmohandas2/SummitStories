"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { compressImage } from "../../lib/compress-image";
import { managedImageAsset, MAX_IMAGE_BYTES } from "../../lib/image-assets";
import { safeImageUrl } from "../../lib/blog-schema";
import { useErrorToast, useSuccessToast } from "../ToastProvider";
import { useBuilderMedia } from "./BuilderMediaProvider";

export default function ImageSourceInput({
  value,
  onChange,
  cover = false,
}: {
  value: string;
  onChange: (value: string) => void;
  cover?: boolean;
}) {
  const media = useBuilderMedia();
  const input = useRef<HTMLInputElement>(null);
  const change = useRef(onChange);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  const uploaded = !!managedImageAsset(value);
  async function attach(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !media.begin()) return;
    setError("");
    try {
      setProgress("Optimizing image…");
      const optimized = await compressImage(file);
      if (optimized.size > MAX_IMAGE_BYTES)
        throw new Error(
          "The optimized image is still over 4 MB. Choose a smaller image.",
        );
      setProgress("Uploading image…");
      const form = new FormData();
      form.set("file", optimized);
      const response = await fetch("/api/images", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error ?? "Unable to upload the image. Please try again.",
        );
      if (typeof data.url !== "string" || !managedImageAsset(data.url))
        throw new Error("The upload returned an invalid image URL.");
      change.current(data.url);
      showSuccess("Image optimized and uploaded.");
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Unable to process this image. Please try again.";
      setError(message);
      showError(message);
    } finally {
      setProgress("");
      media.finish();
    }
  }
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        {cover ? "Cover image URL" : "Image URL"}
        <input
          value={value}
          readOnly={uploaded}
          disabled={media.busy}
          onChange={(event) => onChange(event.target.value)}
          maxLength={2048}
          placeholder="https://… or /images/…"
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        />
      </label>
      <input
        ref={input}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        aria-label={cover ? "Upload cover image file" : "Upload image file"}
        onChange={attach}
        disabled={media.busy || !!value}
        className="hidden"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={media.busy || !!value}
          onClick={() => input.current?.click()}
          className="rounded-lg border border-orange-500 px-3 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 disabled:opacity-50"
        >
          {cover ? "Attach cover image" : "Attach image"}
        </button>
        {value && (
          <button
            type="button"
            disabled={media.busy}
            onClick={() => media.requestRemoval([value], () => onChange(""))}
            className="rounded-lg border border-red-500 px-3 py-2 text-sm text-red-700 dark:text-red-300 disabled:opacity-50"
          >
            {cover ? "Remove cover image" : "Remove image"}
          </button>
        )}
      </div>
      {progress && (
        <p
          role="status"
          className="text-sm text-orange-600 dark:text-orange-400"
        >
          {progress}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {value && safeImageUrl(value) && (
        <img
          src={value}
          alt={cover ? "Cover image preview" : "Selected image preview"}
          loading="lazy"
          className="max-h-40 w-full rounded-lg object-contain bg-gray-100 dark:bg-gray-800"
        />
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        PNG, JPG, JPEG, or WebP, up to 20 MB. Uploads are optimized to WebP, up
        to 1200 pixels. Remove the current image before attaching another.
      </p>
    </div>
  );
}
