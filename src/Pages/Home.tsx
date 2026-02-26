import Header from "../components/Header/Header";

const Home = () => {
  return (
    <div className="bg-gray-50 min-h-screen border-b-[2rem] border-orange-400">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-gradient-to-r from-orange-400 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Explore The World With Me 🌍
          </h2>
          <p className="text-lg md:text-xl mb-8">
            Travel stories, captured images, and unforgettable adventures.
          </p>
          <button className="bg-white text-orange-500 px-8 py-3 rounded-full font-semibold hover:scale-105 transition">
            Read Latest Blog
          </button>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold mb-10 text-center">
            Featured Destinations
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {["Andaman", "Meesapulimala", "Kodaikkanal"].map((place) => (
              <div
                key={place}
                className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition"
              >
                <div className="h-60 bg-gray-300"></div>
                <div className="p-6 bg-white">
                  <h4 className="text-xl font-semibold">{place}</h4>
                  <p className="text-gray-500 mt-2">
                    A beautiful journey through {place}.
                  </p>
                </div>
              </div>
            ))}
          </div>
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
                  <h4 className="font-semibold text-lg">
                    Travel Blog #{blog}
                  </h4>
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