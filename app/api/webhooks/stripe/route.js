import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createCJOrder, buildCJOrderPayload } from '@/lib/cj';
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      try {
        await fulfillOrder(session);
      } catch (err) {
        console.error('Fulfillment error:', err.message);
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(session) {
  const meta = session.metadata || {};

  let cartItems = [];
  try {
    cartItems = JSON.parse(meta.cart_items || '[]');
  } catch {
    throw new Error('Failed to parse cart_items');
  }

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

      await supabase.from('orders').upsert({
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

      console.log(`[Fulfillment] Order saved to Supabase: ${order.id}`);
    } catch (err) {
      console.error('[Fulfillment] Supabase save error:', err.message);
    }
  }

  // 2. Create CJ order (automatic fulfillment)
  const cjPayload = buildCJOrderPayload(order, cartItems);
  let cjOrder = null;

  try {
    cjOrder = await createCJOrder(cjPayload);
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
    console.error('[Fulfillment] CJ order error:', err.message);
  }

  // 3. Send confirmation email
  try {
    await sendOrderConfirmation({ order, items: cartItems });
  } catch (err) {
    console.error('[Email] Error:', err.message);
  }

  return cjOrder;
}
