import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-8xl mb-6">🔍</p>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-3">404 – Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="bg-[#FF9900] hover:bg-[#e88b00] text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          className="border border-gray-300 hover:border-gray-500 text-gray-700 font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
