/**
 * CJ Dropshipping API Client
 * Docs: https://developers.cjdropshipping.com/
 */

import { slugify } from './format';

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

let accessToken = null;
let tokenExpiry = null;

// ─── Auth ────────────────────────────────────────────────────────────────────

async function getAccessToken() {
  // Reuse token if still valid (with 5 min buffer)
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return accessToken;
  }

  const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.CJ_EMAIL,
      apiKey: process.env.CJ_API_KEY,
    }),
  });

  const data = await res.json();

  if (!data.result) {
    throw new Error(`CJ Auth failed: ${data.message}`);
  }

  accessToken = data.data.accessToken;
  // CJ tokens expire after 24h; store expiry
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

  return accessToken;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cjFetch(endpoint, options = {}, attempt = 1) {
  const MAX_ATTEMPTS = 4;
  try {
    const token = await getAccessToken();

    const res = await fetch(`${CJ_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
        ...(options.headers || {}),
      },
    });

    const data = await res.json();

    if (!data.result) {
      // CJ throttles requests aggressively and its error wording varies, so
      // retry ANY failure a few times with an increasing delay. This is what
      // keeps products from silently disappearing when several CJ calls fire
      // at once (homepage: categories + featured + pinned product).
      if (attempt < MAX_ATTEMPTS) {
        await sleep(800 * attempt);
        return cjFetch(endpoint, options, attempt + 1);
      }
      throw new Error(`CJ API error [${endpoint}]: ${data.message}`);
    }

    return data.data;
  } catch (err) {
    // Network-level failures are also worth a couple of retries.
    if (attempt < MAX_ATTEMPTS && err.name === 'TypeError') {
      await sleep(1000 * attempt);
      return cjFetch(endpoint, options, attempt + 1);
    }
    throw err;
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

/**
 * Search products from CJ catalog
 * @param {Object} params - pageNum, pageSize, productNameEn, categoryId
 */
export async function searchProducts(params = {}) {
  const query = new URLSearchParams({
    pageNum: params.pageNum || 1,
    pageSize: params.pageSize || 20,
    ...(params.productNameEn && { productNameEn: params.productNameEn }),
    ...(params.categoryId && { categoryId: params.categoryId }),
  }).toString();

  return cjFetch(`/product/list?${query}`);
}

/**
 * Get full product details by CJ product ID
 */
export async function getProductById(pid) {
  return cjFetch(`/product/query?pid=${pid}`);
}

/**
 * Get product categories (raw CJ 3-level tree)
 */
export async function getCategories() {
  return cjFetch('/product/getCategory');
}

// ─── Navigation categories ─────────────────────────────────────────────────────

// In-module cache so we don't refetch the (large) category tree on every request.
let navCategoriesCache = null;
let navCategoriesExpiry = 0;

/**
 * Fetch CJ categories and normalize them into top-level navigation entries.
 *
 * CJ's getCategory returns a 3-level tree:
 *   [{ categoryFirstName, categoryFirstList: [
 *        { categorySecondName, categorySecondList: [
 *            { categoryId, categoryName }   ← ONLY the leaf level has an id
 *        ]}
 *   ]}]
 *
 * Only leaf categories carry a real `categoryId` usable to filter products,
 * so each first-level nav entry keeps the list of leaf ids beneath it.
 *
 * @returns {Promise<Array<{ name: string, slug: string, leafIds: string[] }>>}
 */
export async function getNavCategories() {
  if (navCategoriesCache && Date.now() < navCategoriesExpiry) {
    return navCategoriesCache;
  }

  try {
    const data = await getCategories();
    const firstLevels = Array.isArray(data) ? data : [];

    const nav = firstLevels
      .map((first) => {
        const leafIds = [];
        (first.categoryFirstList || []).forEach((second) => {
          (second.categorySecondList || []).forEach((leaf) => {
            if (leaf.categoryId) leafIds.push(leaf.categoryId);
          });
        });
        const name = (first.categoryFirstName || '').trim();
        return { name, slug: slugify(name), leafIds };
      })
      // Keep every real CJ category (by name). Don't drop those whose leaf
      // ids couldn't be parsed — otherwise the navbar falls back to the
      // generic placeholder tabs that don't filter anything.
      .filter((c) => c.name && c.slug);

    // Only cache a non-empty result, so a transient failure can recover.
    if (nav.length > 0) {
      navCategoriesCache = nav;
      navCategoriesExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6h
    }
    return nav;
  } catch (err) {
    console.error('CJ nav categories error:', err.message);
    return [];
  }
}

/**
 * Fetch products for a first-level nav category (identified by its slug).
 *
 * Because CJ only exposes ids on leaf categories, we query a handful of the
 * category's leaf sub-categories in parallel and merge the results
 * (deduplicated by pid) to build a representative product listing.
 *
 * @param {string} slug - first-level category slug (e.g. "consumer-electronics")
 * @param {Object} [opts]
 * @param {number} [opts.limit=24]     - max products to return
 * @param {number} [opts.maxLeaves=6]  - how many leaf sub-categories to sample
 * @returns {Promise<{ list: Array, categoryName: string|null }>}
 */
export async function getProductsByCategorySlug(slug, opts = {}) {
  const { limit = 24, maxLeaves = 3 } = opts;

  const nav = await getNavCategories();
  const category = nav.find((c) => c.slug === slug);
  if (!category) return { list: [], categoryName: null };

  const leaves = category.leafIds.slice(0, maxLeaves);

  // Fallback: if this category has no usable leaf ids, search by its name so
  // the tab still returns relevant products instead of an empty page.
  if (leaves.length === 0) {
    try {
      const data = await searchProducts({
        pageNum: 1,
        pageSize: limit,
        productNameEn: category.name,
      });
      return { list: (data?.list || []).slice(0, limit), categoryName: category.name };
    } catch {
      return { list: [], categoryName: category.name };
    }
  }

  const pageSize = Math.max(6, Math.ceil(limit / Math.max(leaves.length, 1)) + 4);

  const results = await Promise.all(
    leaves.map((categoryId) =>
      searchProducts({ pageNum: 1, pageSize, categoryId }).catch(() => ({ list: [] }))
    )
  );

  const seen = new Set();
  const merged = [];
  for (const r of results) {
    for (const p of r?.list || []) {
      if (p?.pid && !seen.has(p.pid)) {
        seen.add(p.pid);
        merged.push(p);
      }
    }
  }

  return { list: merged.slice(0, limit), categoryName: category.name };
}

// ─── Shipping ────────────────────────────────────────────────────────────────

/**
 * Get shipping rates for a product
 * @param {string} pid - CJ product ID
 * @param {string} countryCode - e.g. 'US', 'CA'
 * @param {number} quantity
 */
export async function getShippingRates(pid, countryCode, quantity = 1) {
  return cjFetch(
    `/logistic/freightCalculate?pid=${pid}&countryCode=${countryCode}&quantity=${quantity}`
  );
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * Create an order on CJ Dropshipping (called automatically after Stripe payment)
 * @param {Object} orderData
 */
export async function createCJOrder(orderData) {
  return cjFetch('/shopping/order/createOrderV2', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

/**
 * Get order status from CJ
 * @param {string} orderId - CJ order ID
 */
export async function getCJOrderStatus(orderId) {
  return cjFetch(`/shopping/order/getOrderDetail?orderId=${orderId}`);
}

/**
 * Pay for a CJ order using your CJ wallet balance.
 * This confirms the order so CJ actually ships it. Requires a funded CJ balance.
 * @param {string} orderId - CJ order ID returned by createCJOrder
 */
export async function payCJOrderByBalance(orderId) {
  return cjFetch('/shopping/pay/payBalance', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

/**
 * Get your current CJ wallet balance.
 */
export async function getCJBalance() {
  return cjFetch('/shopping/pay/getBalance');
}

/**
 * Build CJ order payload from our internal order format
 * @param {Object} order - order from Supabase
 * @param {Array} items - cart items with CJ pid and variant info
 */
export function buildCJOrderPayload(order, items) {
  return {
    orderNumber: order.id,
    // Ship-from warehouse country. CJ requires this. Defaults to China ('CN'),
    // which matches the default CJPacket logistics. Override with the env var
    // CJ_FROM_COUNTRY_CODE if your products ship from another warehouse (e.g. 'US').
    fromCountryCode: process.env.CJ_FROM_COUNTRY_CODE || 'CN',
    shippingZip: order.shipping_zip,
    shippingCountryCode: order.shipping_country_code,
    shippingCountry: order.shipping_country,
    shippingProvince: order.shipping_province,
    shippingCity: order.shipping_city,
    shippingAddress: order.shipping_address,
    shippingCustomerName: order.shipping_name,
    // CJ requires a non-empty phone. Fall back to a placeholder if the customer
    // didn't provide one (checkout now makes it required, so this is a safety net).
    shippingPhone: order.shipping_phone || process.env.CJ_FALLBACK_PHONE || '0000000000',
    products: items.map((item) => ({
      vid: item.variant_id,   // CJ variant ID
      quantity: item.quantity,
    })),
    logisticName: order.shipping_method || 'CJPacket Ordinary',
    remark: `Exceptionel order #${order.id}`,
  };
}
