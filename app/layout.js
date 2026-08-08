import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { getNavCategories } from '@/lib/cj';

export const metadata = {
  title: {
    default: 'Exceptionel — Shop Smarter',
    template: '%s | Exceptionel',
  },
  description:
    'Exceptionel — your one-stop shop for top-quality products delivered to the USA & Canada.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    siteName: 'Exceptionel',
    type: 'website',
  },
};

export default async function RootLayout({ children }) {
  // Load the real CJ Dropshipping categories so the nav tabs match their names.
  let categories = [];
  try {
    categories = await getNavCategories();
  } catch {
    categories = [];
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 antialiased">
        <Navbar categories={categories} />
        <CartDrawer />
        <main className="flex-1">{children}</main>
        <Footer />

        {/* Exceptionel AI advisor chat widget (single instance — no duplicates) */}
        <Script
          src="https://exceptionel-ai.vercel.app/public/embed.js"
          data-merchant="f0b52c5e-ce48-49d7-b41f-619983c1b8c5"
          data-api="https://exceptionel-ai.vercel.app"
          data-title="Exceptionel Advisor"
          data-accent="#7c5cff"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
