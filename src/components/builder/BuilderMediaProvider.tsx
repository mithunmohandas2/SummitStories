"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { managedImageAsset } from "../../lib/image-assets";
import ConfirmationDialog from "../ConfirmationDialog";
import { useErrorToast, useSuccessToast } from "../ToastProvider";

type Removal = { urls: string[]; remove: () => void };
type MediaControls = {
  busy: boolean;
  begin: () => boolean;
  finish: () => void;
  requestRemoval: (urls: string[], remove: () => void) => void;
};
const MediaContext = createContext<MediaControls | null>(null);
export function useBuilderMedia() {
  const context = useContext(MediaContext);
  if (!context)
    throw new Error("Image controls must be inside the blog builder.");
  return context;
}

export default function BuilderMediaProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [pending, setPending] = useState<Removal | null>(null);
  const [error, setError] = useState("");
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  function begin() {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    return true;
  }
  function finish() {
    locked.current = false;
    setBusy(false);
  }
  function requestRemoval(urls: string[], remove: () => void) {
    if (locked.current) return;
    const unique = [...new Set(urls.filter(Boolean))];
    if (!unique.length) {
      remove();
      return;
    }
    setError("");
    setPending({ urls: unique, remove });
  }
  async function confirmRemoval() {
    if (!pending || !begin()) return;
    setError("");
    try {
      const assets = new Map<string, string>();
      for (const url of pending.urls) {
        const asset = managedImageAsset(url);
        if (asset) assets.set(`${asset.cloud}/${asset.publicId}`, url);
      }
      for (const url of assets.values()) {
        const response = await fetch("/api/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        // A reference to another user's upload may be detached, never destroyed.
        if (response.status === 403) continue;
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error ?? "Unable to delete the image. Please try again.",
          );
      }
      pending.remove();
      setPending(null);
      showSuccess("Image content removed.");
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Unable to remove the images. Please try again.";
      setError(message);
      showError(message);
    } finally {
      finish();
    }
  }
  const hasUploads = pending?.urls.some((url) => managedImageAsset(url));
  return (
    <MediaContext.Provider value={{ busy, begin, finish, requestRemoval }}>
      {children}
      {pending && (
        <ConfirmationDialog
          title="Remove image content?"
          busy={busy}
          error={error}
          confirmLabel="Remove images"
          onConfirm={confirmRemoval}
          onDismiss={() => setPending(null)}
        >
          {hasUploads
            ? "Remove the selected image content? Images uploaded by your account will also be permanently deleted from Cloudinary, including anywhere else the same image is used. Other image links are only removed from this draft."
            : "Remove the selected image content from this draft? Linked files will remain at their original source."}
        </ConfirmationDialog>
      )}
    </MediaContext.Provider>
  );
}
