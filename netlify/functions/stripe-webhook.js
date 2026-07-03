/**
 * Netlify Function — Stripe Webhook
 * URL: https://exceptionel.com/.netlify/functions/stripe-webhook
 *
 * This function receives Stripe payment confirmations and automatically
 * creates orders on CJ Dropshipping (fulfillment 100% automatique).
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ─── CJ Dropshipping helpers (inline — no module imports in Netlify Functions) ──

let _accessToken = null;
let _tokenExpiry = null;

async function getCJToken() {
  if (_accessToken && _tokenExpiry && Date.now() < _tokenExpiry - 5 * 60 * 1000) {
    return _accessToken;
  }

  const res = await fetch(
    'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.CJ_EMAIL,
        apiKey: process.env.CJ_API_KEY,
      }),
    }
  );

  const data = await res.json();
  if (!data.result) throw new Error(`CJ Auth failed: ${data.message}`);

  _accessToken = data.data.accessToken;
  _tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return _accessToken;
}

async function createCJOrder(payload) {
  const token = await getCJToken();

  const res = await fetch(
    'https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  if (!data.result) throw new Error(`CJ order failed: ${data.message}`);
  return data.data;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // ─── Handle checkout.session.completed ──────────────────────────────────────
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    if (session.payment_status !== 'paid') {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    try {
      await fulfillOrder(session);
    } catch (err) {
      // Log but don't fail — avoids Stripe retrying unnecessarily
      console.error('Fulfillment error:', err.message);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};

// ─── Fulfillment ──────────────────────────────────────────────────────────────

async function fulfillOrder(session) {
  const meta = session.metadata || {};

  let cartItems = [];
  try {
    cartItems = JSON.parse(meta.cart_items || '[]');
  } catch {
    throw new Error('Failed to parse cart_items from Stripe metadata');
  }

  if (!cartItems.length) {
    throw new Error('No cart items found in session metadata');
  }

  const orderId = session.id;

  // Build CJ order payload
  const payload = {
    orderNumber: orderId,
    shippingZip: meta.shipping_zip,
    shippingCountryCode: meta.shipping_country_code,
    shippingCountry: meta.shipping_country,
    shippingProvince: meta.shipping_province,
    shippingCity: meta.shipping_city,
    shippingAddress: meta.shipping_address,
    shippingCustomerName: meta.shipping_name,
    shippingPhone: meta.shipping_phone || '',
    products: cartItems.map((item) => ({
      vid: item.variant_id,
      quantity: item.quantity,
    })),
    logisticName: 'CJPacket Ordinary',
    remark: `Exceptionel order #${orderId}`,
  };

  console.log(`[Fulfillment] Creating CJ order for ${meta.shipping_name} — ${orderId}`);

  const cjOrder = await createCJOrder(payload);

  console.log(`[Fulfillment] ✅ CJ order created: ${cjOrder?.orderId}`);

  return cjOrder;
}
