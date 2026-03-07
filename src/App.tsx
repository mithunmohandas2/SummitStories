import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import BlogDetails from "./pages/BlogDetails";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import KodaikanalBlog from "./pages/blogs/KodaikanalBlog";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />

          <Route path="/blogs" element={<BlogDetails />} />
          <Route path="/blogs/kodaikanal-trip" element={<KodaikanalBlog />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
