import BlogDetails from "./BlogDetails";
import Link from "next/link";

const Home = () => {
  return (
    <div className="min-h-screen border-b-[2rem] border-orange-400">
      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-[url('/images/hero.webp')] bg-cover bg-center">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            A Place for Every Perspective 🌍
          </h2>
          <p className="text-lg md:text-xl mb-8 text-white">
            Travel stories, captured images, and unforgettable adventures.
          </p>
          <Link
            href="/blogs"
            className="inline-block bg-white dark:bg-gray-900 text-orange-500 dark:text-orange-400 border px-8 py-3 rounded-full font-semibold hover:scale-105 transition"
          >
            Read Latest Blog
          </Link>
        </div>
      </section>

      {/* Latest Blogs */}
      <section className="py-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold mb-10 text-center">Latest Blogs</h3>
          <BlogDetails limit={6} showViewAll />
        </div>
      </section>
    </div>
  );
};

export default Home;
