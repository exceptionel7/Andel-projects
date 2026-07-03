'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingCart, Zap, Truck, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';

export default function ProductDetail({ product, shippingUS, shippingCA }) {
  const addItem = useCartStore((s) => s.addItem);

  const variants = product.variants || product.variantList || [];

  // CJ may return productImageSet as an array OR a comma-separated string
  // (or omit it entirely). Handle every shape so a single product never crashes.
  const rawImages = Array.isArray(product.productImageSet)
    ? product.productImageSet
    : typeof product.productImageSet === 'string'
      ? product.productImageSet.split(',')
      : [];
  const images = (rawImages.length > 0 ? rawImages : [product.productImage])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);

  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [activeImage, setActiveImage] = useState(images[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [addedMsg, setAddedMsg] = useState(false);

  const price = parseFloat(selectedVariant?.variantSellPrice || product.sellPrice || 0);
  const originalPrice = parseFloat(selectedVariant?.variantOriginalPrice || product.originalPrice || 0);
  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  function handleAddToCart() {
    addItem({
      pid: product.pid,
      variant_id: selectedVariant?.vid || product.pid,
      name: product.productNameEn,
      price,
      image: activeImage,
      variant: selectedVariant?.variantNameEn || null,
      quantity,
    });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.productNameEn}
                fill
                className="object-contain p-6"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                No image
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.slice(0, 8).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-xl border-2 overflow-hidden transition-all ${
                    activeImage === img
                      ? 'border-[#FF9900]'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-contain p-1" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            {product.productNameEn}
          </h1>

          {/* Rating placeholder */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-[#FF9900] text-[#FF9900]' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm text-[#FF9900] hover:underline cursor-pointer">See reviews</span>
          </div>

          <hr />

          {/* Price */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(price)}</span>
              {originalPrice > price && (
                <>
                  <span className="text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                  <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Price in USD. Taxes & shipping at checkout.</p>
          </div>

          {/* Variants */}
          {variants.length > 1 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Variant: <span className="font-normal">{selectedVariant?.variantNameEn}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.vid}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      selectedVariant?.vid === v.vid
                        ? 'border-[#FF9900] bg-[#FF9900]/10 text-[#FF9900] font-semibold'
                        : 'border-gray-300 hover:border-gray-500 text-gray-700'
                    }`}
                  >
                    {v.variantNameEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Qty:</span>
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100 transition-colors text-lg font-bold"
              >
                −
              </button>
              <span className="px-4 py-2 border-x border-gray-300 text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-100 transition-colors text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-colors text-lg ${
                addedMsg
                  ? 'bg-green-500 text-white'
                  : 'bg-[#FF9900] hover:bg-[#e88b00] text-white'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {addedMsg ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>
            <button
              onClick={() => {
                handleAddToCart();
                setTimeout(() => { window.location.href = '/checkout'; }, 300);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#FFD814] hover:bg-[#f5ca00] text-gray-900 font-bold py-3.5 rounded-xl transition-colors text-lg"
            >
              <Zap className="w-5 h-5" />
              Buy Now
            </button>
          </div>

          {/* Shipping info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Truck className="w-4 h-4 text-[#FF9900]" />
              <span>
                <strong>US Shipping:</strong>{' '}
                {shippingUS?.[0]
                  ? `${shippingUS[0].logisticName} — ${shippingUS[0].logisticTime}`
                  : 'Calculated at checkout'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Truck className="w-4 h-4 text-[#FF9900]" />
              <span>
                <strong>CA Shipping:</strong>{' '}
                {shippingCA?.[0]
                  ? `${shippingCA[0].logisticName} — ${shippingCA[0].logisticTime}`
                  : 'Calculated at checkout'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Shield className="w-4 h-4 text-[#FF9900]" />
              <span>Secure checkout · 30-day return policy</span>
            </div>
          </div>

          {/* Product description */}
          {product.description && (
            <div className="border-t pt-4">
              <h2 className="font-semibold text-gray-900 mb-2">Product Details</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
