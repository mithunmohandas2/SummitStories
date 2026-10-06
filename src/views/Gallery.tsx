import { readBlogs } from "../lib/blogs";
import { collectGalleryImages } from "../lib/gallery";
import GalleryGrid from "../components/gallery/GalleryGrid";
import { DatabaseUnavailableError } from "../lib/database-errors";
import DatabaseUnavailableNotice from "../components/DatabaseUnavailableNotice";

async function Gallery() {
  let images;
  try { images = collectGalleryImages(await readBlogs()); }
  catch (error) {
    if (error instanceof DatabaseUnavailableError) return <DatabaseUnavailableNotice />;
    throw error;
  }
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12 pt-6">
      <h1 className="text-4xl font-bold mb-3">Gallery</h1>
      {!!images?.length && (
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Moments from our shared stories. Select an image to take a closer
          look.
        </p>
      )}
      <GalleryGrid images={images} />
    </section>
  );
}

export default Gallery;
