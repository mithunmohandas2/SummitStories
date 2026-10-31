import { IMAGE_TYPES, MAX_ORIGINAL_IMAGE_BYTES } from "./image-assets";

export async function compressImage(
  file: File,
  options?: {
    maxWidth?: number;
    quality?: number;
    outputFormat?: "image/webp";
    thresholdKB?: number;
  },
): Promise<File> {
  const {
    maxWidth = 1200,
    quality = 0.7,
    outputFormat = "image/webp",
    thresholdKB = 300,
  } = options ?? {};
  if (!IMAGE_TYPES.includes(file.type))
    throw new Error("Choose a PNG, JPG, JPEG, or WebP image.");
  if (!file.size || file.size > MAX_ORIGINAL_IMAGE_BYTES)
    throw new Error("Choose an image under 20 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      maxWidth / bitmap.width,
      maxWidth / bitmap.height,
    );
    if (
      scale === 1 &&
      file.type === outputFormat &&
      file.size <= thresholdKB * 1024
    )
      return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Image compression is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("Unable to compress this image.")),
        outputFormat,
        quality,
      ),
    );
    if (blob.type !== outputFormat)
      throw new Error("This browser cannot convert images to WebP.");
    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "") || "image"}.webp`,
      { type: outputFormat },
    );
  } finally {
    bitmap.close();
  }
}
