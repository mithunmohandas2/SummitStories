import type { Metadata } from "next";
import { safeImageUrl, type Blog } from "./blog-schema";

export function siteUrl(): URL {
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    "https://summit-stories.vercel.app",
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password)
        return new URL(url.origin);
    } catch {
      // Continue to the next configured origin.
    }
  }
  return new URL("https://summit-stories.vercel.app");
}

export function blogMetadata(blog: Blog, base = siteUrl()): Metadata {
  const url = new URL(`/blogs/${encodeURIComponent(blog.slug)}`, base).href;
  const image = new URL(
    blog.coverImage && safeImageUrl(blog.coverImage)
      ? blog.coverImage
      : "/images/logo.webp",
    base,
  ).href;
  return {
    title: blog.title,
    description: blog.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "Summit Stories",
      url,
      title: blog.title,
      description: blog.description,
      authors: [blog.author],
      publishedTime: blog.publishedAt ?? blog.createdAt,
      images: [{ url: image, alt: blog.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.description,
      images: [{ url: image, alt: blog.title }],
    },
  };
}
