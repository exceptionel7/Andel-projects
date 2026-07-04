/**
 * Parse a CJ price into a number.
 * CJ may return a single value ("8.62") or a range ("8.62-12.30" / "8.62~12.30").
 * For ranges we use the lowest value (the "from" price).
 * Returns null when no valid number can be extracted.
 */
export function parsePrice(amount) {
  if (amount == null) return null;
  if (typeof amount === 'number') return Number.isFinite(amount) ? amount : null;

  const first = String(amount).split(/[-~]/)[0].trim();
  const num = parseFloat(first);
  return Number.isFinite(num) ? num : null;
}

/**
 * Format a price in USD or CAD.
 * Robust against CJ price ranges and invalid values (no more "$NaN").
 */
export function formatPrice(amount, currency = 'USD') {
  const value = parsePrice(amount);
  if (value == null) return 'Price unavailable';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Truncate text to n chars
 */
export function truncate(str, n = 100) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/**
 * Slugify a string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
