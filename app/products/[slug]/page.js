import { searchProducts, getProductById, getShippingRates } from '@/lib/cj';
import { slugify, formatPrice } from '@/lib/format';
import ProductDetail from './ProductDetail';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;

  // The URL param is the CJ product id (pid) — look it up directly.
  try {
    const product = await getProductById(slug);
    if (product?.productNameEn) {
      return {
        title: product.productNameEn,
        description: product.productNameEn,
        openGraph: { images: [product.productImage].filter(Boolean) },
      };
    }
  } catch {}

  // Fallback for legacy slug-based URLs.
  try {
    const data = await searchProducts({ pageNum: 1, pageSize: 50 });
    const products = data?.list || [];
    const product = products.find(
      (p) => slugify(p.productNameEn || p.pid) === slug || p.pid === slug
    );
    if (product) {
      return {
        title: product.productNameEn,
        description: product.productNameEn,
        openGraph: { images: [product.productImage].filter(Boolean) },
      };
    }
  } catch {}

  return { title: 'Product' };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  let product = null;

  try {
    // Try direct PID lookup first
    const detail = await getProductById(slug);
    if (detail) product = detail;
  } catch {
    // Fall back to search
    try {
      const data = await searchProducts({ pageNum: 1, pageSize: 50 });
      const products = data?.list || [];
      product = products.find(
        (p) => slugify(p.productNameEn || p.pid) === slug || p.pid === slug
      );
      if (product) {
        // Get full details
        try {
          const detail = await getProductById(product.pid);
          if (detail) product = detail;
        } catch {}
      }
    } catch {}
  }

  if (!product) notFound();

  // Get shipping rates for US and CA
  let shippingUS = null;
  let shippingCA = null;
  try {
    shippingUS = await getShippingRates(product.pid, 'US', 1);
  } catch {}
  try {
    shippingCA = await getShippingRates(product.pid, 'CA', 1);
  } catch {}

  return (
    <ProductDetail
      product={product}
      shippingUS={shippingUS}
      shippingCA={shippingCA}
    />
  );
}
