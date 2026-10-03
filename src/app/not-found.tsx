import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-6">Page not found</h1>
      <Link href="/" className="text-orange-500 dark:text-orange-400 underline">
        Return home
      </Link>
    </div>
  );
}
