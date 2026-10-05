"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { invalidateBlogListCache } from "../../lib/blog-list-cache";
import { useErrorToast, useSuccessToast } from "../ToastProvider";
import DeleteBlogDialog from "./DeleteBlogDialog";

export default function BlogOwnerActions({
  slug,
  title,
  authorUsername,
}: {
  slug: string;
  title: string;
  authorUsername?: string;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/blogs/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error ?? "Unable to delete this blog. Please try again.",
        );
      setOpen(false);
      showSuccess("Blog deleted successfully.");
      invalidateBlogListCache();
      if (pathname === `/blogs/${slug}`) router.push("/blogs");
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error && cause.message !== "Failed to fetch"
          ? cause.message
          : "Unable to delete this blog. Please try again.";
      setError(message);
      showError(message);
    } finally {
      setBusy(false);
    }
  }

  if (
    status !== "authenticated" ||
    !authorUsername ||
    session.user.username !== authorUsername
  )
    return null;
  return (
    <>
      <div className="mt-4 inline-flex flex-wrap items-center gap-2">
        <Link
          href={`/builder?edit=${encodeURIComponent(slug)}`}
          className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400"
        >
          Edit blog
        </Link>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setError("");
            setOpen(true);
          }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete blog
        </button>
      </div>
      {open && (
        <DeleteBlogDialog
          title={title}
          busy={busy}
          error={error}
          onConfirm={confirmDelete}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
}
