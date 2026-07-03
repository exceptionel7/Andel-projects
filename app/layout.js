import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 antialiased">
        <Navbar />
        <CartDrawer />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
