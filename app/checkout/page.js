'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Lock, Truck } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
];

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zip: '',
    country: 'US',
  });

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const currency = COUNTRIES.find((c) => c.code === form.country)?.currency || 'USD';

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shipping: form, currency }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) throw new Error(stripeError.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products before checking out.</p>
        <a href="/products" className="bg-[#FF9900] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#e88b00] transition-colors">
          Shop Now
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <Lock className="w-5 h-5 text-[#FF9900]" />
        Secure Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 555 000 0000"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#FF9900]" />
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="123 Main Street, Apt 4B"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  placeholder="New York"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State / Province *</label>
                <input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  required
                  placeholder="NY"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code *</label>
                <input
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  required
                  placeholder="10001"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF9900] hover:bg-[#e88b00] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            {loading ? 'Redirecting to payment…' : `Pay ${formatPrice(total, currency)}`}
          </button>

          <p className="text-xs text-center text-gray-400">
            Your payment is secured by Stripe. We never store your card details.
          </p>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div key={item.variant_id} className="flex gap-3">
                  <div className="relative w-14 h-14 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="56px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 truncate">{item.name}</p>
                    {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                    <p className="text-xs font-semibold text-gray-900 mt-0.5">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Calculated at payment</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
