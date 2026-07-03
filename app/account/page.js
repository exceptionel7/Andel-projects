'use client';

import { useState, useEffect } from 'react';
import { Package, User, MapPin, LogOut, Eye, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';

const TABS = [
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'profile', label: 'Profile', icon: User },
];

const STATUS_CONFIG = {
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700',   icon: CheckCircle },
  shipped:    { label: 'Shipped',    color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700',      icon: XCircle },
};

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState(null);

  async function loadOrders(e) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLoading(true);
    setOrders([]);

    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(emailInput.trim())}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setEmail(emailInput.trim());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTracking(order) {
    setSelectedOrder(order);
    setTracking(null);
    try {
      const res = await fetch(`/api/orders/track?orderId=${order.id}`);
      const data = await res.json();
      setTracking(data.tracking);
    } catch {}
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <nav className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-gray-100 last:border-0 ${
                  activeTab === id
                    ? 'bg-[#FF9900]/10 text-[#FF9900] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Email lookup */}
              {!email ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Track Your Orders</h2>
                  <p className="text-sm text-gray-500 mb-4">Enter the email you used at checkout to see your orders.</p>
                  <form onSubmit={loadOrders} className="flex gap-3">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#FF9900] hover:bg-[#e88b00] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Loading…' : 'View Orders'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">Orders for {email}</h2>
                    <button
                      onClick={() => { setEmail(''); setOrders([]); setSelectedOrder(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Change email
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No orders found for this email.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => {
                        const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
                        const StatusIcon = status.icon;
                        return (
                          <div key={order.id} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs text-gray-400 font-mono">
                                  #{order.id.slice(-12).toUpperCase()}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                  {formatPrice(order.total_amount, order.currency)}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(order.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </span>
                                <button
                                  onClick={() => loadTracking(order)}
                                  className="text-xs text-[#FF9900] hover:underline flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Track
                                </button>
                              </div>
                            </div>

                            {/* Items preview */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(order.items || []).slice(0, 3).map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                                  {item.image && (
                                    <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                                      <Image src={item.image} alt={item.name} fill className="object-contain" sizes="24px" />
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-600 truncate max-w-[120px]">{item.name}</span>
                                  <span className="text-xs text-gray-400">×{item.quantity}</span>
                                </div>
                              ))}
                              {(order.items || []).length > 3 && (
                                <span className="text-xs text-gray-400 self-center">
                                  +{order.items.length - 3} more
                                </span>
                              )}
                            </div>

                            {/* Tracking details */}
                            {selectedOrder?.id === order.id && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                {tracking ? (
                                  <div className="space-y-2">
                                    <p className="text-sm font-semibold text-gray-900">Tracking Info</p>
                                    {tracking.trackingNumber && (
                                      <p className="text-sm text-gray-600">
                                        Tracking #: <span className="font-mono font-semibold">{tracking.trackingNumber}</span>
                                      </p>
                                    )}
                                    {tracking.trackingUrl && (
                                      <a
                                        href={tracking.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-[#FF9900] hover:underline"
                                      >
                                        <Truck className="w-4 h-4" />
                                        Track on carrier website
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400">
                                    Tracking info will appear once your order ships.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
                  />
                </div>
                <button className="bg-[#FF9900] hover:bg-[#e88b00] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                  Save Changes
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Full authentication (login/register) activates after Supabase setup.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
