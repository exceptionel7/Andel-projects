import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createCJOrder, buildCJOrderPayload, getProductById } from '@/lib/cj';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmation } from '@/lib/email';

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let debug = { handled: false, type: event.type };
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      try {
        debug = await fulfillOrder(session);
      } catch (err) {
        console.error('Fulfillment error:', err.message);
        debug = { handled: true, fatalError: err.message };
      }
    } else {
      debug = { handled: false, reason: `payment_status=${session.payment_status}` };
    }
  }

  // The debug field is only visible to Stripe (this endpoint requires a valid
  // Stripe signature), so it's safe to surface fulfillment details here.
  return NextResponse.json({ received: true, debug });
}

// Ensure every cart item has a real CJ variant id (vid). Items added from a
// product listing carry the pid as a fallback; look up the product and use its
// first variant so CJ can actually create the order.
async function resolveCartVariants(items) {
  return Promise.all(
    items.map(async (item) => {
      if (item.variant_id && item.variant_id !== item.pid) return item;
      try {
        const product = await getProductById(item.pid);
        const variants = product?.variants || product?.variantList || [];
        const vid = variants[0]?.vid;
        if (vid) return { ...item, variant_id: vid };
      } catch (err) {
        console.error(
          `[Fulfillment] Could not resolve variant for pid ${item.pid}:`,
          err.message
        );
      }
      return item;
    })
  );
}

async function fulfillOrder(session) {
  const result = { handled: true, steps: {} };
  const meta = session.metadata || {};

  let cartItems = [];
  try {
    cartItems = JSON.parse(meta.cart_items || '[]');
  } catch {
    throw new Error('Failed to parse cart_items');
  }

  result.steps.itemCount = cartItems.length;
  if (!cartItems.length) throw new Error('No cart items found');

  // Build internal order
  const order = {
    id: session.id,
    shipping_name: meta.shipping_name,
    shipping_email: meta.shipping_email || session.customer_email,
    shipping_phone: meta.shipping_phone || '',
    shipping_address: meta.shipping_address,
    shipping_city: meta.shipping_city,
    shipping_province: meta.shipping_province,
    shipping_zip: meta.shipping_zip,
    shipping_country: meta.shipping_country,
    shipping_country_code: meta.shipping_country_code,
    shipping_method: 'CJPacket Ordinary',
    total_amount: session.amount_total / 100,
    currency: session.currency.toUpperCase(),
    status: 'processing',
  };

  // 1. Save to Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error } = await supabase.from('orders').upsert({
        id: order.id,
        status: order.status,
        customer_name: order.shipping_name,
        customer_email: order.shipping_email,
        customer_phone: order.shipping_phone,
        shipping_address: order.shipping_address,
        shipping_city: order.shipping_city,
        shipping_province: order.shipping_province,
        shipping_zip: order.shipping_zip,
        shipping_country: order.shipping_country,
        shipping_country_code: order.shipping_country_code,
        total_amount: order.total_amount,
        currency: order.currency,
        items: cartItems,
      });

      if (error) throw new Error(error.message);
      result.steps.supabase = 'saved';
      console.log(`[Fulfillment] Order saved to Supabase: ${order.id}`);
    } catch (err) {
      result.steps.supabase = `error: ${err.message}`;
      console.error('[Fulfillment] Supabase save error:', err.message);
    }
  } else {
    result.steps.supabase = 'skipped (missing Supabase env vars)';
  }

  // 2. Create CJ order (automatic fulfillment)
  // CJ requires a valid variant id (vid). Items added from a listing fall back
  // to the pid, so resolve each product's real first variant before ordering.
  const orderItems = await resolveCartVariants(cartItems);
  result.steps.variantIds = orderItems.map((i) => i.variant_id);
  const cjPayload = buildCJOrderPayload(order, orderItems);

  try {
    const cjOrder = await createCJOrder(cjPayload);
    result.steps.cjOrderId = cjOrder?.orderId || null;
    result.steps.cj = 'created';
    console.log(`[Fulfillment] ✅ CJ order created: ${cjOrder?.orderId}`);

    // Update Supabase with CJ order ID
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && cjOrder?.orderId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      await supabase
        .from('orders')
        .update({ cj_order_id: cjOrder.orderId, status: 'confirmed' })
        .eq('id', order.id);
    }
  } catch (err) {
    result.steps.cj = `error: ${err.message}`;
    console.error('[Fulfillment] CJ order error:', err.message);
    // Surface the CJ error in Supabase (status column) so it's readable
    // straight from the table, without digging into logs or Stripe.
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        await supabase
          .from('orders')
          .update({ status: `cj_error: ${String(err.message).slice(0, 400)}` })
          .eq('id', order.id);
      } catch {}
    }
  }

  // 3. Send confirmation email
  try {
    await sendOrderConfirmation({ order, items: cartItems });
    result.steps.email = 'sent';
  } catch (err) {
    result.steps.email = `error: ${err.message}`;
    console.error('[Email] Error:', err.message);
  }

  return result;
}
