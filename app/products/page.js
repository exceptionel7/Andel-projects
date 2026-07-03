import { searchProducts, getCategories } from '@/lib/cj';
import ProductCard from '@/components/ProductCard';
import { slugify } from '@/lib/format';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';

export const metadata = { title: 'All Products' };
export const revalidate = 3600;

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1', 10);
  const query = params?.q || '';
  const categoryId = params?.categoryId || '';

  let products = [];
  let total = 0;

  try {
    const data = await searchProducts({
      pageNum: page,
      pageSize: 24,
      ...(query && { productNameEn: query }),
      ...(categoryId && { categoryId }),
    });
    products = (data?.list || []).map((p) => ({
      ...p,
      slug: slugify(p.productNameEn || p.pid),
    }));
    total = data?.total || 0;
  } catch (err) {
    console.error('CJ products error:', err.message);
  }

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {query ? `Results for "${query}"` : 'All Products'}
          </h1>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} products found</p>
          )}
        </div>

        {/* Search box */}
        <form className="flex gap-2" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search products…"
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#FF9900] w-64"
          />
          <button
            type="submit"
            className="bg-[#FF9900] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#e88b00] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Products */}
      {products.length > 0 ? (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.pid} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={`/products?${new URLSearchParams({ ...(query && { q: query }), page: page - 1 })}`}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
                >
                  ← Previous
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/products?${new URLSearchParams({ ...(query && { q: query }), page: page + 1 })}`}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-xl font-medium">No products found</p>
          <p className="text-sm mt-2">Try a different search term</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-[#FF9900] font-medium hover:underline"
          >
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
}
