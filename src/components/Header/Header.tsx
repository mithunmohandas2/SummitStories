import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/images/logo.png" alt="Summit stories" className="w-14" />
          <Link to="/" className="text-2xl font-bold text-orange-500">
            Summit Stories
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <Link to="/" className="hover:text-orange-500 transition">
            Home
          </Link>
          <Link to="/blogs" className="hover:text-orange-500 transition">
            Blogs
          </Link>
          <Link to="/gallery" className="hover:text-orange-500 transition">
            Gallery
          </Link>
          <Link to="/about" className="hover:text-orange-500 transition">
            About
          </Link>
        </nav>

        {/* Mobile Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <div className="space-y-1">
            <span className="block w-6 h-0.5 bg-black"></span>
            <span className="block w-6 h-0.5 bg-black"></span>
            <span className="block w-6 h-0.5 bg-black"></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white px-6 pb-6 space-y-4">
          <Link to="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link to="/blogs" onClick={() => setOpen(false)}>
            Blogs
          </Link>
          <Link to="/gallery" onClick={() => setOpen(false)}>
            Gallery
          </Link>
          <Link to="/about" onClick={() => setOpen(false)}>
            About
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
