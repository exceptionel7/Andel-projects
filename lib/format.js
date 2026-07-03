/**
 * Format a price in USD or CAD
 */
export function formatPrice(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
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
