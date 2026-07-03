import Link from 'next/link';
import Image from 'next/image';
import { searchProducts, getNavCategories } from '@/lib/cj';
import ProductCard from '@/components/ProductCard';
import { slugify } from '@/lib/format';
import { ChevronRight, Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

// Revalidate every 6 hours
export const revalidate = 21600;

const heroBanners = [
  {
    title: 'Shop Everything',
    subtitle: 'Top deals on Electronics, Fashion, Home & more',
    cta: 'Shop Now',
    href: '/products',
    bg: 'from-[#131921] to-[#232f3e]',
    accent: '#FF9900',
  },
];

// Pick a fitting emoji for a CJ category based on keywords in its name.
function iconForCategory(name = '') {
  const n = name.toLowerCase();
  const map = [
    [['phone', 'electronic', 'computer', 'office', 'tech'], '📱'],
    [['women', 'men', 'cloth', 'fashion', 'apparel', 'underwear'], '👗'],
    [['shoe', 'bag', 'luggage'], '👜'],
    [['home', 'garden', 'furniture', 'kitchen', 'household'], '🏡'],
    [['sport', 'outdoor', 'fitness'], '⚽'],
    [['beauty', 'health', 'hair', 'makeup', 'cosmetic'], '💄'],
    [['toy', 'kid', 'baby', 'game'], '🧸'],
    [['tool', 'hardware', 'improvement'], '🔧'],
    [['pet', 'animal'], '🐾'],
    [['jewel', 'watch', 'accessor'], '💍'],
    [['car', 'auto', 'motor', 'vehicle'], '🚗'],
    [['light', 'lamp'], '💡'],
  ];
  for (const [keys, icon] of map) {
    if (keys.some((k) => n.includes(k))) return icon;
  }
  return '🛍️';
}

// Fallback grid shown only if the CJ category tree can't be loaded.
const FALLBACK_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Garden', slug: 'home-garden' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Toys', slug: 'toys' },
  { name: 'Tools', slug: 'tools' },
  { name: 'Pets', slug: 'pets' },
];

const perks = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $35' },
  { icon: Shield, title: 'Secure Payments', desc: 'Powered by Stripe' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
];

async function getFeaturedProducts() {
  try {
    const data = await searchProducts({ pageNum: 1, pageSize: 12 });
    return (data?.list || []).map((p) => ({
      ...p,
      slug: slugify(p.productNameEn || p.pid),
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  // Real CJ categories (limited to 8 for the grid), with a graceful fallback.
  let navCategories = [];
  try {
    navCategories = await getNavCategories();
  } catch {
    navCategories = [];
  }
  const categories = (navCategories.length > 0 ? navCategories : FALLBACK_CATEGORIES)
    .slice(0, 8)
    .map((c) => ({ name: c.name, slug: c.slug, icon: iconForCategory(c.name) }));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#131921] to-[#232f3e] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <p className="text-[#FF9900] text-sm font-semibold uppercase tracking-widest">
              Welcome to Exceptionel
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Shop Smarter,<br />
              <span className="text-[#FF9900]">Live Better</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-lg">
              Thousands of top-quality products delivered fast to the USA & Canada.
              Unbeatable prices, zero compromise on quality.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="bg-[#FF9900] hover:bg-[#e88b00] text-white font-bold px-8 py-3 rounded-xl transition-colors text-lg"
              >
                Shop Now
              </Link>
              <Link
                href="/products?q=deals"
                className="border border-white/30 hover:border-white text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
              >
                Today&apos;s Deals
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-72 h-72 md:w-80 md:h-80">
              <Image
                src="/logo.jpg"
                alt="Exceptionel"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Perks bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="bg-[#FF9900]/10 p-2.5 rounded-xl">
                <Icon className="w-5 h-5 text-[#FF9900]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Link href="/products" className="text-[#FF9900] text-sm font-medium flex items-center gap-1 hover:underline">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#FF9900] hover:shadow-md transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link href="/products" className="text-[#FF9900] text-sm font-medium flex items-center gap-1 hover:underline">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.pid} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Products loading…</p>
            <p className="text-sm mt-2">Check your CJ API credentials in .env.local</p>
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-[#131921] to-[#232f3e] rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">Ready to find something exceptional?</h2>
          <p className="text-gray-300 mb-6">Thousands of products. Fast shipping. Guaranteed satisfaction.</p>
          <Link
            href="/products"
            className="inline-block bg-[#FF9900] hover:bg-[#e88b00] text-white font-bold px-10 py-3 rounded-xl transition-colors text-lg"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
