import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Summit Stories",
    short_name: "Summit Stories",
    description: "Travel diaries, photography, and unforgettable adventures.",
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#f97316",
    prefer_related_applications: false,
    categories: ["travel", "photography", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
