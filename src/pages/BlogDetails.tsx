import { useNavigate } from "react-router-dom";
import { blogs } from "../data/blogs";

function BlogDetails({ limit }: { limit?: number }) {
  const navigate = useNavigate();

  const displayedBlogs = limit && limit > 0 ? blogs.slice(0, limit) : blogs;

  return (
    <div className="grid md:grid-cols-3 gap-8 px-6 py-10">
      {displayedBlogs.map((blog) => (
        <div
          onClick={() => navigate(blog?.path)}
          key={blog.id}
          className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition cursor-pointer"
        >
          <div
            className={`h-60 bg-[url('${blog?.image}')] bg-cover bg-center`}
          ></div>
          <div className="p-6 bg-white">
            <h4 className="text-xl font-semibold">{blog?.title}</h4>
            <p className="text-gray-500 mt-2">{blog?.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default BlogDetails;
