/**
 * CJ Dropshipping API Client
 * Docs: https://developers.cjdropshipping.com/
 */

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

async function cjFetch(endpoint, options = {}) {
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
    throw new Error(`CJ API error [${endpoint}]: ${data.message}`);
  }

  return data.data;
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
 * Get product categories
 */
export async function getCategories() {
  return cjFetch('/product/getCategory');
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
 * Build CJ order payload from our internal order format
 * @param {Object} order - order from Supabase
 * @param {Array} items - cart items with CJ pid and variant info
 */
export function buildCJOrderPayload(order, items) {
  return {
    orderNumber: order.id,
    shippingZip: order.shipping_zip,
    shippingCountryCode: order.shipping_country_code,
    shippingCountry: order.shipping_country,
    shippingProvince: order.shipping_province,
    shippingCity: order.shipping_city,
    shippingAddress: order.shipping_address,
    shippingCustomerName: order.shipping_name,
    shippingPhone: order.shipping_phone,
    products: items.map((item) => ({
      vid: item.variant_id,   // CJ variant ID
      quantity: item.quantity,
    })),
    logisticName: order.shipping_method || 'CJPacket Ordinary',
    remark: `Exceptionel order #${order.id}`,
  };
}
