"use client";

import { useEffect, useId, useRef } from "react";

export default function DeleteBlogDialog({
  title,
  busy,
  error,
  onConfirm,
  onDismiss,
}: {
  title: string;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onDismiss();
      }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onDismiss();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[80dvh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-left text-gray-900 dark:text-gray-100 shadow-2xl backdrop:bg-black/60"
    >
      <h2 id={headingId} className="text-xl font-semibold">
        Delete blog?
      </h2>
      <p
        id={descriptionId}
        className="mt-3 break-words text-sm text-gray-600 dark:text-gray-300"
      >
        Delete “{title}”? This permanently removes the blog and cannot be
        undone.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          ref={cancelRef}
          type="button"
          disabled={busy}
          onClick={onDismiss}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Delete blog"}
        </button>
      </div>
    </dialog>
  );
}
