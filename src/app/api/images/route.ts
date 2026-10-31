import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import {
  destroyImage,
  imageFileType,
  ImageStorageError,
  uploadImage,
} from "../../../lib/cloudinary";
import { MAX_IMAGE_BYTES } from "../../../lib/image-assets";

export const runtime = "nodejs";

async function readLimitedBody(request: Request, maximum: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new ImageStorageError("No image was provided.", 400);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maximum) {
        await reader.cancel();
        throw new ImageStorageError("The image request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Uint8Array(Buffer.concat(chunks));
}

function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof ImageStorageError
          ? error.message
          : "Unable to process this image. Please try again.",
    },
    {
      status: error instanceof ImageStorageError ? error.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username)
      return Response.json(
        { error: "Log in to upload images." },
        { status: 401 },
      );
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data"))
      throw new ImageStorageError("Choose an image file to upload.", 400);
    const body = await readLimitedBody(request, MAX_IMAGE_BYTES + 64 * 1024);
    let form;
    try {
      form = await new Response(body, {
        headers: { "Content-Type": contentType },
      }).formData();
    } catch {
      throw new ImageStorageError("Invalid image upload.", 400);
    }
    const files = form.getAll("file");
    const file = files[0];
    if (files.length !== 1 || !(file instanceof File) || !file.size)
      throw new ImageStorageError("Choose one image file to upload.", 400);
    if (file.size > MAX_IMAGE_BYTES)
      throw new ImageStorageError(
        "The optimized image must be under 4 MB.",
        413,
      );
    const type = imageFileType(new Uint8Array(await file.arrayBuffer()));
    if (!type || type !== file.type)
      throw new ImageStorageError(
        "Choose a valid PNG, JPG, JPEG, or WebP image.",
        400,
      );
    const image = await uploadImage(file, session.user.username);
    return Response.json(image, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username)
      return Response.json(
        { error: "Log in to delete images." },
        { status: 401 },
      );
    const body = await readLimitedBody(request, 4096);
    let input;
    try {
      input = JSON.parse(new TextDecoder().decode(body));
    } catch {
      throw new ImageStorageError("Invalid image URL.", 400);
    }
    if (typeof input?.url !== "string" || input.url.length > 2048)
      throw new ImageStorageError("Invalid image URL.", 400);
    await destroyImage(input.url, session.user.username);
    return Response.json(
      { message: "Image deleted." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
