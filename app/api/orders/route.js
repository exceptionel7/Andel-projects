import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
