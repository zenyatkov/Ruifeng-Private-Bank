import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-6xl font-bold text-white">404</h1>
        <p className="text-slate-400">Page not found. The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
