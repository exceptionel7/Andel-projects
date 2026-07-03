'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#131921] text-gray-300 mt-16">
      {/* Back to top */}
      <div
        className="bg-[#232f3e] text-white text-sm text-center py-3 cursor-pointer hover:bg-[#2d3a4a] transition-colors"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Back to top
      </div>

      {/* Links grid */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Get to Know Us</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white hover:underline transition-colors">About Exceptionel</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:underline transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Make Money With Us</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white hover:underline transition-colors">Sell on Exceptionel</Link></li>
            <li><Link href="#" className="hover:text-white hover:underline transition-colors">Become an Affiliate</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Help</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/account" className="hover:text-white hover:underline transition-colors">Your Account</Link></li>
            <li><Link href="/account?tab=orders" className="hover:text-white hover:underline transition-colors">Your Orders</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:underline transition-colors">Customer Service</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/legal/privacy" className="hover:text-white hover:underline transition-colors">Privacy Notice</Link></li>
            <li><Link href="/legal/terms" className="hover:text-white hover:underline transition-colors">Conditions of Use</Link></li>
            <li><Link href="/legal/returns" className="hover:text-white hover:underline transition-colors">Returns Policy</Link></li>
          </ul>
        </div>
      </div>

      <hr className="border-gray-700 mx-6" />

      {/* Bottom */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.jpg"
            alt="Exceptionel"
            width={120}
            height={40}
            className="h-8 w-auto object-contain brightness-0 invert"
          />
        </Link>
        <p>© {new Date().getFullYear()} Exceptionel. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
