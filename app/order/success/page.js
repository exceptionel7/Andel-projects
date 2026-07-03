'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Mail } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    // Clear the cart after successful payment
    clearCart();
  }, [clearCart]);

  const steps = [
    { icon: CheckCircle, label: 'Payment confirmed', done: true },
    { icon: Package, label: 'Order sent to supplier', done: true },
    { icon: Truck, label: 'Shipping in progress', done: false },
    { icon: Mail, label: 'Tracking email on the way', done: false },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      {/* Success icon */}
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-14 h-14 text-green-500" />
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
        Order Confirmed! 🎉
      </h1>
      <p className="text-gray-500 mb-2">
        Thank you for your purchase. Your order has been automatically sent to our supplier.
      </p>
      {sessionId && (
        <p className="text-xs text-gray-400 mb-8 font-mono">
          Order ref: {sessionId.slice(-16).toUpperCase()}
        </p>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 text-left">
        <h2 className="font-semibold text-gray-900 mb-4">What happens next?</h2>
        <div className="space-y-4">
          {steps.map(({ icon: Icon, label, done }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Icon className={`w-4 h-4 ${done ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
              <span className={`text-sm ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
              {done && (
                <span className="ml-auto text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/account?tab=orders"
          className="bg-[#FF9900] hover:bg-[#e88b00] text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Track My Order
        </Link>
        <Link
          href="/products"
          className="border border-gray-300 hover:border-gray-500 text-gray-700 font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-gray-400">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
