import { readBlogs } from "../lib/blogs";
import { collectGalleryImages } from "../lib/gallery";
import GalleryGrid from "../components/gallery/GalleryGrid";

async function Gallery() {
  const images = collectGalleryImages(await readBlogs());
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
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
