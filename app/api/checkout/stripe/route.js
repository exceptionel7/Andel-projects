import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req) {
  try {
    const { items, shipping, currency = 'usd' } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Build Stripe line items
    const line_items = items.map((item) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.name,
          ...(item.image && { images: [item.image] }),
          metadata: {
            pid: item.pid,
            variant_id: item.variant_id,
            variant: item.variant || '',
          },
        },
        unit_amount: Math.round(parseFloat(item.price) * 100), // in cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      currency: currency.toLowerCase(),
      success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: {
        // Store shipping info for fulfillment webhook
        shipping_name: shipping.name,
        shipping_email: shipping.email,
        shipping_phone: shipping.phone || '',
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_province: shipping.province,
        shipping_zip: shipping.zip,
        shipping_country: shipping.country === 'CA' ? 'Canada' : 'United States',
        shipping_country_code: shipping.country,
        // Serialize cart items for webhook
        cart_items: JSON.stringify(
          items.map((i) => ({
            pid: i.pid,
            variant_id: i.variant_id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image || '',
            variant: i.variant || '',
          }))
        ),
      },
      customer_email: shipping.email,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
