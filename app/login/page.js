'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '' });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccess('Account created! You can now track your orders.');
        setMode('login');
      } else {
        // Login — redirect to account page with email
        window.location.href = `/account?email=${encodeURIComponent(form.email)}`;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-extrabold text-[#131921]">
              Excep<span className="text-[#FF9900]">tionel</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {/* Toggle */}
          <div className="flex rounded-xl border border-gray-200 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === 'login' ? 'bg-[#FF9900] text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === 'register' ? 'bg-[#FF9900] text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required={mode === 'register'}
                    placeholder="John Doe"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#FF9900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-[#FF9900]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF9900] hover:bg-[#e88b00] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing, you agree to our{' '}
            <Link href="/legal/terms" className="text-[#FF9900] hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="text-[#FF9900] hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <p className="text-center mt-4 text-sm text-gray-500">
          <Link href="/" className="text-[#FF9900] hover:underline">← Back to shopping</Link>
        </p>
      </div>
    </div>
  );
}
