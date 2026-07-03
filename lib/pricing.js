/**
 * Retail / profit-margin pricing.
 *
 * Customers pay the RETAIL price, computed from the CJ cost:
 *
 *     retail = (CJ cost × MARKUP_MULTIPLIER) + MARKUP_FLAT
 *
 * How the profit works:
 *   1. The customer pays the full retail price at checkout → the money lands
 *      in YOUR Stripe account.
 *   2. When the order is fulfilled, CJ Dropshipping charges you only the CJ
 *      cost (product + shipping) from your CJ balance.
 *   3. Your profit = retail collected on Stripe − CJ cost. It stays in Stripe.
 *
 * The flat amount is added on top of the multiplier to help cover CJ shipping
 * on cheap items (so you don't lose money on a $2 product with $5 shipping).
 *
 * Tune your margin WITHOUT touching code by setting these environment variables
 * in Vercel (Settings → Environment Variables), then redeploying:
 *
 *     NEXT_PUBLIC_PRICE_MARKUP        multiplier applied to the CJ cost   (e.g. 2.5)
 *     NEXT_PUBLIC_PRICE_MARKUP_FLAT   flat USD amount added on top        (e.g. 6)
 */

import { parsePrice } from './format';

export const DEFAULT_MARKUP_MULTIPLIER = 2;
export const DEFAULT_MARKUP_FLAT = 5;

export function getMarkupMultiplier() {
  const v = parseFloat(process.env.NEXT_PUBLIC_PRICE_MARKUP);
  return Number.isFinite(v) && v >= 1 ? v : DEFAULT_MARKUP_MULTIPLIER;
}

export function getMarkupFlat() {
  const v = parseFloat(process.env.NEXT_PUBLIC_PRICE_MARKUP_FLAT);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULT_MARKUP_FLAT;
}

// Round up to a clean "charm" price ending in .99.
// Uses floor()+0.99 so the result is never rounded BELOW the target price
// (protecting your margin).
function toCharmPrice(value) {
  if (!Number.isFinite(value)) return value;
  return Math.floor(value) + 0.99;
}

/**
 * Convert a CJ cost into the retail price the customer pays.
 *
 * Accepts a number, a string ("8.62"), or a CJ price range ("8.62-12.30",
 * in which case the lowest value is used). Returns null when no valid cost
 * can be parsed.
 *
 * @param {number|string} cost - the raw CJ cost / sellPrice
 * @returns {number|null} retail price, or null
 */
export function retailPrice(cost) {
  const base = parsePrice(cost);
  if (base == null) return null;
  return toCharmPrice(base * getMarkupMultiplier() + getMarkupFlat());
}
