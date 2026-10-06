function About() {
  return (
    <div className="min-h-screen border-b-[2rem] border-orange-400">
      {/* Hero Section */}
      <section className="py-12 bg-blue-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-2 mb-5 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 rounded-full">
            About Us
          </span>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            A Place for Every
            <span className="text-orange-500"> Perspective.</span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A welcoming space where stories, experiences, ideas, and creativity
            come together.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-10 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-500 mb-3">
                Our Story
              </p>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Share what matters to you.
              </h2>

              <div className="space-y-5 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  We created this platform to give everyone a place to share
                  their thoughts, experiences, knowledge, and creativity with
                  others.
                </p>

                <p>
                  Whether you enjoy writing personal stories, sharing useful
                  tips, exploring new ideas, or discovering interesting
                  perspectives, this is a place where your voice can be heard.
                </p>

                <p>
                  Our goal is to build a simple and welcoming community where
                  people can connect through words, learn from one another, and
                  inspire new ways of thinking.
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="grid gap-5">
              <div className="rounded-2xl bg-blue-50 dark:bg-slate-800 p-7 shadow-sm">
                <div className="text-3xl mb-4">✍️</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Share Your Story
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Turn your thoughts, experiences, and ideas into stories that
                  others can discover.
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/20 p-7 shadow-sm">
                <div className="text-3xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Discover Perspectives
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore stories from different people, places, experiences,
                  and points of view.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-slate-800 p-7 shadow-sm">
                <div className="text-3xl mb-4">💡</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Inspire Ideas
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Learn something new, start conversations, and inspire others
                  through meaningful content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Message */}
      <section className="py-10 bg-blue-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-5">
            Everyone has a story worth sharing.
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Write what matters to you. Discover stories that matter to others.
            Be part of a growing community built around sharing ideas.
          </p>

          <p className="text-xl md:text-2xl font-bold text-orange-500">
            Share Stories. Spark Ideas.
          </p>
        </div>
      </section>
    </div>
  );
}

export default About;
