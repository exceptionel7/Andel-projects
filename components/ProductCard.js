'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice, truncate } from '@/lib/format';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);

  const {
    pid,
    productNameEn,
    sellPrice,
    originalPrice,
    productImage,
    variants,
    rating = 4.2,
    reviewCount = 0,
  } = product;

  const discount = originalPrice && originalPrice > sellPrice
    ? Math.round(((originalPrice - sellPrice) / originalPrice) * 100)
    : null;

  function handleAddToCart(e) {
    e.preventDefault();
    const firstVariant = variants?.[0];
    addItem({
      pid,
      variant_id: firstVariant?.vid || pid,
      name: productNameEn,
      price: parseFloat(sellPrice),
      image: productImage,
      variant: firstVariant?.variantNameEn || null,
    });
  }

  return (
    <Link
      href={`/products/${pid}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:border-[#FF9900]/30 transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {productImage ? (
          <Image
            src={productImage}
            alt={productNameEn}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            No image
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
          aria-label="Add to wishlist"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-sm text-gray-800 leading-snug line-clamp-2">
          {truncate(productNameEn, 80)}
        </p>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < Math.floor(rating)
                  ? 'fill-[#FF9900] text-[#FF9900]'
                  : 'text-gray-300'
              }`}
            />
          ))}
          {reviewCount > 0 && (
            <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(sellPrice)}
          </span>
          {originalPrice && originalPrice > sellPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className="mt-1 w-full flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-[#e88b00] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
