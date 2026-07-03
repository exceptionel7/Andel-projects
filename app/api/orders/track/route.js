import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CJ tracking helper
async function getCJTracking(cjOrderId) {
  try {
    // Get CJ access token
    const authRes = await fetch(
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
    const authData = await authRes.json();
    if (!authData.result) return null;

    const token = authData.data.accessToken;

    // Get order details with tracking
    const res = await fetch(
      `https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetail?orderId=${cjOrderId}`,
      { headers: { 'CJ-Access-Token': token } }
    );
    const data = await res.json();
    return data.result ? data.data : null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get order from DB
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get live tracking from CJ if we have a CJ order ID
    let tracking = null;
    if (order.cj_order_id) {
      tracking = await getCJTracking(order.cj_order_id);
    }

    return NextResponse.json({ order, tracking });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
