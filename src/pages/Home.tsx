import Header from "../components/Header/Header";
import BlogDetails from "./BlogDetails";

const Home = () => {
  return (
    <div className="min-h-screen border-b-[2rem] border-orange-400">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-[url('/images/hero.webp')] bg-cover bg-center">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Explore The World With Me 🌍
          </h2>
          <p className="text-lg md:text-xl mb-8 text-white">
            Travel stories, captured images, and unforgettable adventures.
          </p>
          <button className="bg-white text-orange-500 border px-8 py-3 rounded-full font-semibold hover:scale-105 transition">
            Read Latest Blog
          </button>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="bg-blue-50 pt-20 pb-10">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center px-6">
            Featured Destinations
          </h3>
          <BlogDetails limit={3} />
        </div>
      </section>

      {/* Latest Blogs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold mb-10 text-center">
            Latest Travel Blogs
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((blog) => (
              <div
                key={blog}
                className="rounded-xl overflow-hidden shadow hover:shadow-xl transition"
              >
                <div className="h-48 bg-gray-300"></div>
                <div className="p-5">
                  <h4 className="font-semibold text-lg">Travel Blog #{blog}</h4>
                  <p className="text-gray-500 text-sm mt-2">
                    Experience the adventure with cinematic storytelling.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
