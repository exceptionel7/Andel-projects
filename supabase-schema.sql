-- ============================================================
-- Exceptionel — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,           -- Stripe session ID
  cj_order_id     TEXT,                        -- CJ Dropshipping order ID
  status          TEXT DEFAULT 'processing',   -- processing | shipped | delivered | cancelled
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city   TEXT NOT NULL,
  shipping_province TEXT NOT NULL,
  shipping_zip    TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_country_code TEXT NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  items           JSONB NOT NULL,             -- Cart items snapshot
  tracking_number TEXT,
  tracking_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: customers can only see their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own orders"
  ON orders FOR SELECT
  USING (customer_email = auth.jwt() ->> 'email');

-- Admins can see all orders (you'll be admin)
CREATE POLICY "Service role can do anything"
  ON orders
  USING (auth.role() = 'service_role');

-- Updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Wishlist table (optional, for future)
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pid         TEXT NOT NULL,
  product_name TEXT,
  product_image TEXT,
  price       NUMERIC(10,2),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pid)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own wishlist"
  ON wishlists
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
