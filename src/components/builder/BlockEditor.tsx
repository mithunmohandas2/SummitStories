"use client";

import type { Block, ImageItem } from "../../lib/blog-schema";

type BlockType = Block["type"];
const types: { type: BlockType; label: string }[] = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading", label: "Subheading" },
  { type: "image", label: "Image" },
  { type: "youtube", label: "YouTube video" },
  { type: "carousel", label: "Image carousel" },
  { type: "row", label: "Row / columns" },
];

const emptyImage = (): ImageItem => ({ src: "", alt: "", caption: "" });
export function createBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "paragraph":
      return { id, type, text: "" };
    case "heading":
      return { id, type, text: "", level: 2 };
    case "image":
      return { id, type, ...emptyImage() };
    case "youtube":
      return { id, type, url: "", caption: "" };
    case "carousel":
      return { id, type, images: [emptyImage()] };
    case "row":
      return {
        id,
        type,
        columns: Array.from({ length: 2 }, () => ({
          id: crypto.randomUUID(),
          content: [],
        })),
      };
  }
}

const control =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-gray-100";
const button =
  "rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-40";

function ImageFields({
  image,
  onChange,
}: {
  image: ImageItem;
  onChange: (image: ImageItem) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Image URL
        <input
          value={image.src}
          onChange={(event) => onChange({ ...image, src: event.target.value })}
          placeholder="https://… or /images/…"
          maxLength={2048}
          className={control}
        />
      </label>
      <label className="block text-sm">
        Alternative text
        <input
          value={image.alt}
          onChange={(event) => onChange({ ...image, alt: event.target.value })}
          placeholder="Describe the image"
          maxLength={300}
          className={control}
        />
      </label>
      <label className="block text-sm">
        Caption
        <input
          value={image.caption}
          onChange={(event) =>
            onChange({ ...image, caption: event.target.value })
          }
          maxLength={1000}
          className={control}
        />
      </label>
    </div>
  );
}

export default function BlockEditor({
  blocks,
  onChange,
  depth = 0,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  depth?: number;
}) {
  const update = (index: number, block: Block) =>
    onChange(blocks.map((current, i) => (i === index ? block : current)));
  const move = (index: number, direction: number) => {
    const next = [...blocks];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <section
          key={block.id}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-4 space-y-4"
          aria-label={`${block.type} block ${index + 1}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-sm">
              {index + 1}.{" "}
              {types.find((item) => item.type === block.type)?.label}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label={`Move block ${index + 1} up`}
                className={button}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move block ${index + 1} down`}
                className={button}
                disabled={index === blocks.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className={`${button} text-red-700 dark:text-red-300`}
                onClick={() =>
                  onChange(blocks.filter((current) => current.id !== block.id))
                }
              >
                Remove
              </button>
            </div>
          </div>
          {block.type === "paragraph" && (
            <label className="block text-sm">
              Paragraph
              <textarea
                value={block.text}
                onChange={(event) =>
                  update(index, { ...block, text: event.target.value })
                }
                rows={5}
                maxLength={20000}
                className={control}
                placeholder="Tell your story…"
              />
            </label>
          )}
          {block.type === "heading" && (
            <>
              <label className="block text-sm">
                Subheading
                <input
                  value={block.text}
                  onChange={(event) =>
                    update(index, { ...block, text: event.target.value })
                  }
                  maxLength={300}
                  className={control}
                />
              </label>
              <label className="block text-sm">
                Heading level
                <select
                  value={block.level}
                  onChange={(event) =>
                    update(index, {
                      ...block,
                      level: Number(event.target.value) as 2 | 3,
                    })
                  }
                  className={control}
                >
                  <option value={2}>Heading 2</option>
                  <option value={3}>Heading 3</option>
                </select>
              </label>
            </>
          )}
          {block.type === "image" && (
            <ImageFields
              image={block}
              onChange={(image) => update(index, { ...block, ...image })}
            />
          )}
          {block.type === "youtube" && (
            <>
              <label className="block text-sm">
                YouTube URL
                <input
                  value={block.url}
                  onChange={(event) =>
                    update(index, { ...block, url: event.target.value })
                  }
                  maxLength={2048}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className={control}
                />
              </label>
              <label className="block text-sm">
                Video caption
                <input
                  value={block.caption}
                  onChange={(event) =>
                    update(index, { ...block, caption: event.target.value })
                  }
                  maxLength={1000}
                  className={control}
                />
              </label>
            </>
          )}
          {block.type === "carousel" && (
            <div className="space-y-4">
              {block.images.map((image, imageIndex) => (
                <div
                  key={imageIndex}
                  className="border rounded-lg bg-white dark:bg-gray-900 p-3 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Slide {imageIndex + 1}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className={button}
                        aria-label={`Move slide ${imageIndex + 1} up`}
                        disabled={imageIndex === 0}
                        onClick={() => {
                          const images = [...block.images];
                          [images[imageIndex], images[imageIndex - 1]] = [
                            images[imageIndex - 1],
                            images[imageIndex],
                          ];
                          update(index, { ...block, images });
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={button}
                        disabled={block.images.length === 1}
                        onClick={() =>
                          update(index, {
                            ...block,
                            images: block.images.filter(
                              (_, i) => i !== imageIndex,
                            ),
                          })
                        }
                      >
                        Remove slide
                      </button>
                    </div>
                  </div>
                  <ImageFields
                    image={image}
                    onChange={(next) =>
                      update(index, {
                        ...block,
                        images: block.images.map((current, i) =>
                          i === imageIndex ? next : current,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className={button}
                disabled={block.images.length >= 20}
                onClick={() =>
                  update(index, {
                    ...block,
                    images: [...block.images, emptyImage()],
                  })
                }
              >
                Add slide
              </button>
            </div>
          )}
          {block.type === "row" && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Columns sit side by side on larger screens and stack on mobile.
              </p>
              <div className="space-y-4">
                {block.columns.map((column, columnIndex) => (
                  <div
                    key={column.id}
                    className="rounded-lg border border-orange-200 dark:border-orange-900 bg-white dark:bg-gray-900 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        Column {columnIndex + 1}
                      </span>
                      <button
                        type="button"
                        disabled={block.columns.length === 1}
                        className={`${button} text-red-700 dark:text-red-300`}
                        onClick={() => {
                          if (
                            column.content.length &&
                            !window.confirm(
                              "Remove this column and its content?",
                            )
                          )
                            return;
                          update(index, {
                            ...block,
                            columns: block.columns.filter(
                              (current) => current.id !== column.id,
                            ),
                          });
                        }}
                      >
                        Remove column
                      </button>
                    </div>
                    <BlockEditor
                      depth={depth + 1}
                      blocks={column.content}
                      onChange={(content) =>
                        update(index, {
                          ...block,
                          columns: block.columns.map((current) =>
                            current.id === column.id
                              ? { ...current, content }
                              : current,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={button}
                disabled={block.columns.length >= 3}
                onClick={() =>
                  update(index, {
                    ...block,
                    columns: [
                      ...block.columns,
                      { id: crypto.randomUUID(), content: [] },
                    ],
                  })
                }
              >
                Add column
              </button>
            </>
          )}
        </section>
      ))}
      <div className="flex flex-wrap gap-2" aria-label="Add content">
        {types
          .filter((item) => item.type !== "row" || depth < 3)
          .map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className={button}
              disabled={blocks.length >= 100}
              onClick={() => onChange([...blocks, createBlock(type)])}
            >
              + {label}
            </button>
          ))}
      </div>
    </div>
  );
}
