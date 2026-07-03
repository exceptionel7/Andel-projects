'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity } = useCartStore();
  const drawerRef = useRef(null);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        closeCart();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, closeCart]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') closeCart();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FF9900]" />
            <h2 className="text-lg font-semibold">
              Cart{count > 0 && <span className="ml-1 text-[#FF9900]">({count})</span>}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-gray-400">
              <ShoppingBag className="w-16 h-16 opacity-30" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Add some products to get started</p>
              <button
                onClick={closeCart}
                className="mt-2 text-[#FF9900] font-medium hover:underline"
              >
                Continue shopping →
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variant_id} className="flex gap-4 bg-gray-50 rounded-xl p-3">
                {/* Image */}
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                  )}
                  <p className="text-sm font-bold text-[#FF9900] mt-1">
                    {formatPrice(item.price)}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity control */}
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium border-x border-gray-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-gray-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.variant_id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 space-y-3 bg-white">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal ({count} items)</span>
              <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400">
              Shipping and taxes calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-[#FF9900] hover:bg-[#e88b00] text-white text-center font-semibold py-3 rounded-xl transition-colors"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={closeCart}
              className="block w-full text-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
