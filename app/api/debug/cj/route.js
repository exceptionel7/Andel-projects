import { NextResponse } from 'next/server';
import { searchProducts, getCategories, getProductById } from '@/lib/cj';

// Always run live (never cached) so we see the real-time CJ response.
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = {};

  // 1. Product list (this is what's failing on the homepage)
  try {
    const data = await searchProducts({ pageNum: 1, pageSize: 3 });
    result.productList = {
      ok: true,
      count: (data?.list || []).length,
      total: data?.total ?? null,
      firstName: data?.list?.[0]?.productNameEn || null,
    };
  } catch (err) {
    result.productList = { ok: false, error: err.message };
  }

  // 2. Single product query (used by the pinned hero card)
  try {
    const p = await getProductById('1502953210804449280');
    result.productQuery = { ok: true, name: p?.productNameEn || null };
  } catch (err) {
    result.productQuery = { ok: false, error: err.message };
  }

  // 3. Categories (these currently work)
  try {
    const cats = await getCategories();
    result.categories = { ok: true, count: Array.isArray(cats) ? cats.length : 0 };
  } catch (err) {
    result.categories = { ok: false, error: err.message };
  }

  // 4. Env presence (booleans only — never expose secret values)
  result.env = {
    hasEmail: !!process.env.CJ_EMAIL,
    hasApiKey: !!process.env.CJ_API_KEY,
  };

  return NextResponse.json(result);
}
