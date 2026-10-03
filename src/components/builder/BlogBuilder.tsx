"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { getSession, useSession } from "next-auth/react";
import Link from "next/link";
import { ZodError } from "zod";
import {
  downloadFilename,
  parseBlog,
  slugify,
  type Blog,
} from "../../lib/blog-schema";
import BlogRenderer from "../blog/BlogRenderer";
import BlockEditor from "./BlockEditor";

function emptyBlog(author: string, username: string): Blog {
  return {
    version: 1,
    slug: "untitled-blog",
    title: "",
    author,
    authorUsername: username,
    description: "",
    coverImage: "",
    createdAt: new Date().toISOString(),
    content: [],
  };
}

export default function BlogBuilder({ author, username }: { author: string; username: string }) {
  const { status, data: session } = useSession();
  const [blog, setBlog] = useState<Blog>(() => emptyBlog(author, username));
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function update(next: Blog) {
    dirty.current = true;
    setBlog(next);
    setMessage("");
    setError("");
  }

  const validationError = (cause: unknown) =>
    cause instanceof ZodError
      ? cause.issues
          .map((issue) => `${issue.path.join(" › ")}: ${issue.message}`)
          .slice(0, 4)
          .join("; ")
      : cause instanceof Error
        ? cause.message
        : "Unable to read this blog.";

  async function download() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const currentSession = await getSession();
      if (!currentSession?.user)
        throw new Error(
          "Your session expired. Log in again to download your blog.",
        );
      const result = parseBlog({
        ...blog,
        author: currentSession.user.name ?? author,
        authorUsername: currentSession.user.username,
        slug: slugify(blog.title),
      });
      const json = JSON.stringify(result, null, 2);
      if (new Blob([json]).size > 1024 * 1024)
        throw new Error("Keep the blog JSON under 1 MB.");
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadFilename(result.title);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      dirty.current = false;
      setMessage(
        `Downloaded ${downloadFilename(result.title)}. Keep the file to reopen your story later.`,
      );
    } catch (cause) {
      setError(validationError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function importBlog(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      dirty.current &&
      !window.confirm("Replace your current content with this JSON file?")
    )
      return;
    try {
      if (file.size > 1024 * 1024)
        throw new Error("Choose a JSON file under 1 MB.");
      const imported = parseBlog(JSON.parse(await file.text()));
      update({ ...imported, author: session?.user?.name ?? author, authorUsername: session?.user?.username ?? username });
      setMessage(
        "Blog imported. You can edit, preview, and download it again.",
      );
    } catch (cause) {
      setError(validationError(cause));
    }
  }

  if (status === "loading")
    return (
      <p role="status" className="p-10 text-center">
        Loading your workspace…
      </p>
    );
  if (status !== "authenticated")
    return (
      <div className="max-w-xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold mb-4">Log in to continue</h1>
        <p className="mb-4">
          Your session has ended. Log in to create and download blogs.
        </p>
        <Link href="/login" className="text-orange-600 dark:text-orange-400 underline">
          Log in
        </Link>
      </div>
    );

  const field = "mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3";
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
      <div className="mb-6">
        <div>
          <h1 className="text-4xl font-bold">Blog builder</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3">
            Build your story, preview it, and download it as JSON.
          </p>
          <p className="text-orange-600 dark:text-orange-400 mb-2">Writing as {author}</p>
        </div>
      </div>
      <div
        role="toolbar"
        aria-label="Blog actions"
        className="sticky top-[var(--site-header-height,5rem)] z-40 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-8 flex flex-wrap justify-end gap-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md"
      >
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={importBlog}
          className="hidden"
          aria-label="Import blog JSON"
        />
        <button
          type="button"
          className="border rounded-md px-4 py-1"
          onClick={() => fileInput.current?.click()}
        >
          Import
        </button>
        <button
          type="button"
          aria-pressed={preview}
          className="border rounded-md px-4 py-1"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Back to editor" : "Preview"}
        </button>
        <button
          type="button"
          disabled={busy}
          className="bg-orange-500 text-white font-semibold rounded-md px-5 py-1 disabled:opacity-50"
          onClick={download}
        >
          {busy ? "Preparing…" : "Download"}
        </button>
      </div>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Your changes stay in this tab until you download them. Images use URLs;
        downloaded files contain the links.
      </p>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 p-4 mb-6">
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-lg bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300 p-4 mb-6"
        >
          {message}
        </p>
      )}
      {preview ? (
        <div className="rounded-2xl border bg-white dark:bg-gray-900">
          <BlogRenderer blog={blog} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
          <aside className="rounded-2xl border bg-white dark:bg-gray-900 p-6 space-y-5">
            <h2 className="text-xl font-semibold">Story details</h2>
            <label className="block text-sm font-medium">
              Blog title
              <input
                value={blog.title}
                maxLength={300}
                onChange={(event) =>
                  update({
                    ...blog,
                    title: event.target.value,
                    slug: slugify(event.target.value),
                  })
                }
                placeholder="A journey to remember"
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                value={blog.description}
                maxLength={1000}
                onChange={(event) =>
                  update({ ...blog, description: event.target.value })
                }
                rows={4}
                className={field}
                placeholder="A short introduction for the blog listing"
              />
            </label>
            <label className="block text-sm font-medium">
              Cover image URL
              <input
                value={blog.coverImage}
                maxLength={2048}
                onChange={(event) =>
                  update({ ...blog, coverImage: event.target.value })
                }
                placeholder="https://… or /images/…"
                className={field}
              />
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The cover is used in blog listings. Add an image block to show it
              in your story.
            </p>
          </aside>
          <section className="rounded-2xl border bg-white dark:bg-gray-900 p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Story content</h2>
            {!blog.content.length && (
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start with a paragraph or add a row to arrange content in
                columns.
              </p>
            )}
            <BlockEditor
              blocks={blog.content}
              onChange={(content) => update({ ...blog, content })}
            />
          </section>
        </div>
      )}
    </div>
  );
}
