import {
  safeImageUrl,
  youtubeId,
  type Block,
  type Blog,
} from "../../lib/blog-schema";
import Carousel from "./Carousel";

const columnClasses = [
  "",
  "grid-cols-1",
  "grid-cols-1 md:grid-cols-2",
  "grid-cols-1 md:grid-cols-3",
];

export function ContentBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-8 min-w-0">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return block.level === 3 ? (
              <h3 key={block.id} className="text-2xl font-semibold break-words">
                {block.text}
              </h3>
            ) : (
              <h2 key={block.id} className="text-3xl font-bold break-words">
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p
                key={block.id}
                className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap break-words"
              >
                {block.text}
              </p>
            );
          case "image":
            return (
              <figure key={block.id} className="space-y-3">
                {safeImageUrl(block.src) ? (
                  <img
                    src={block.src}
                    alt={block.alt}
                    loading="lazy"
                    className="w-full max-h-[480px] object-cover rounded-2xl"
                  />
                ) : (
                  <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    Add an image URL.
                  </div>
                )}
                {block.caption && (
                  <figcaption className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "youtube": {
            const id = youtubeId(block.url);
            return (
              <figure key={block.id} className="space-y-3">
                {id ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={block.caption || "YouTube video"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="aspect-video w-full rounded-xl border-0"
                  />
                ) : (
                  <p className="p-8 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    Add a valid YouTube link.
                  </p>
                )}
                {block.caption && (
                  <figcaption className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "carousel":
            return <Carousel key={block.id} images={block.images} />;
          case "row":
            return (
              <div
                key={block.id}
                className={`grid gap-6 ${columnClasses[block.columns.length] ?? columnClasses[1]}`}
              >
                {block.columns.map((column) => (
                  <ContentBlocks key={column.id} blocks={column.content} />
                ))}
              </div>
            );
        }
      })}
    </div>
  );
}

export default function BlogRenderer({ blog }: { blog: Blog }) {
  return (
    <article className="max-w-5xl mx-auto px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight break-words">
          {blog.title || "Untitled blog"}
        </h1>
        {blog.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-6">{blog.description}</p>
        )}
        <p className="text-orange-600 dark:text-orange-400 mt-4">By {blog.author}</p>
      </header>
      <ContentBlocks blocks={blog.content} />
    </article>
  );
}
