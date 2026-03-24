import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import BlogDetails from "./pages/BlogDetails";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import KodaikanalBlog from "./pages/blogs/KodaikanalBlog";
import BanasuraBlog from "./pages/blogs/BanasuraBlog";
import MankulamWaterfallsBlog from "./pages/blogs/MankulamWaterfallsBlog";
import ChokramudiBlog from "./pages/blogs/ChokramudiBlog";
import MeesapulimalaBlog from "./pages/blogs/MeesapulimalaBlog";

function ScrollHandler() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollHandler />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />

          <Route path="/blogs" element={<BlogDetails />} />
          <Route path="/blogs/kodaikanal-trip" element={<KodaikanalBlog />} />
          <Route path="/blogs/banasura-blog" element={<BanasuraBlog />} />
          <Route path="/blogs/mankulam-blog" element={<MankulamWaterfallsBlog />} />
          <Route path="/blogs/meesapulimala-blog" element={<MeesapulimalaBlog />} />
          <Route path="/blogs/chokramudi-blog" element={<ChokramudiBlog />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;