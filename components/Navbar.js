'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/store';

// Fallback tabs shown only if the CJ category tree can't be loaded.
const FALLBACK_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Garden', slug: 'home-garden' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Toys', slug: 'toys' },
];

export default function Navbar({ categories = [] }) {
  // Use the real CJ categories when available, otherwise the fallback list.
  const navCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const { toggleCart, itemCount, items } = useCartStore();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow ${
        scrolled ? 'shadow-md' : 'border-b border-gray-200'
      }`}
    >
      {/* Top bar */}
      <div className="bg-[#12332E] text-white text-xs text-center py-1 px-4">
        Free shipping on orders over $35 · USA &amp; Canada
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo.jpg"
            alt="Exceptionel"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Search bar */}
        <div className="flex-1 hidden md:flex items-center border-2 border-[#FF9900] rounded-lg overflow-hidden">
          <input
            type="text"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                window.location.href = `/products?q=${encodeURIComponent(query.trim())}`;
              }
            }}
            className="flex-1 px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={() => {
              if (query.trim())
                window.location.href = `/products?q=${encodeURIComponent(query.trim())}`;
            }}
            className="bg-[#FF9900] px-4 py-2 hover:bg-[#e88b00] transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          {/* Mobile search toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Account */}
          <Link
            href="/account"
            className="hidden md:flex flex-col text-xs leading-tight hover:text-[#FF9900] transition-colors"
          >
            <span className="text-gray-500">Hello, sign in</span>
            <span className="font-semibold text-gray-900">Account &amp; Orders</span>
          </Link>

          {/* Cart */}
          <button
            onClick={toggleCart}
            className="relative flex items-center gap-1 p-2 hover:text-[#FF9900] transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF9900] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 flex gap-2">
          <input
            type="text"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF9900]"
          />
          <button
            onClick={() => {
              if (query.trim())
                window.location.href = `/products?q=${encodeURIComponent(query.trim())}`;
            }}
            className="bg-[#FF9900] text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Go
          </button>
        </div>
      )}

      {/* Category strip */}
      <nav className="hidden md:block bg-[#1B4A42] text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-10 text-sm overflow-x-auto">
          <Link href="/products" className="whitespace-nowrap hover:text-[#FF9900] transition-colors font-medium">
            All Products
          </Link>
          {navCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="whitespace-nowrap hover:text-[#FF9900] transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/products" className="block py-2 text-sm font-medium hover:text-[#FF9900]">
              All Products
            </Link>
            {navCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="block py-2 text-sm hover:text-[#FF9900]"
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <hr className="my-2" />
            <Link href="/account" className="block py-2 text-sm hover:text-[#FF9900]">
              Account &amp; Orders
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
