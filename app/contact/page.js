'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h1>
        <p className="text-gray-500">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-500">Have a question? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <Mail className="w-6 h-6 text-[#FF9900] mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Email</p>
            <p className="text-gray-500 text-sm mt-1">support@exceptionel.com</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <MessageSquare className="w-6 h-6 text-[#FF9900] mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Response Time</p>
            <p className="text-gray-500 text-sm mt-1">Within 24 hours</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="john@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              placeholder="Order issue, product question…"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={5}
              placeholder="Describe your issue or question…"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9900] resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-[#e88b00] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
