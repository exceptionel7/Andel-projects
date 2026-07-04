/**
 * Email service using Resend
 * Sign up free at resend.com — 3000 emails/month free
 */

export async function sendOrderConfirmation({ order, items }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set — skipping email');
    return;
  }

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">
          ${item.name}${item.variant ? ` (${item.variant})` : ''}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
      
      <div style="text-align:center;padding:20px 0;border-bottom:3px solid #FF9900">
        <h1 style="color:#12332E;margin:0">Exceptionel</h1>
        <p style="color:#666;margin:4px 0">Shop Smarter, Live Better</p>
      </div>

      <div style="padding:24px 0">
        <h2 style="color:#12332E">Order Confirmed! 🎉</h2>
        <p>Hi <strong>${order.shipping_name}</strong>,</p>
        <p>Thank you for your order! We've received your payment and your order has been automatically sent to our supplier for processing.</p>
        
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#666">Order Reference</p>
          <p style="margin:4px 0;font-family:monospace;font-size:14px">${order.id.slice(-16).toUpperCase()}</p>
        </div>

        <h3 style="color:#12332E;border-bottom:1px solid #eee;padding-bottom:8px">Your Items</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8f8f8">
              <th style="padding:8px;text-align:left;font-size:13px">Product</th>
              <th style="padding:8px;text-align:center;font-size:13px">Qty</th>
              <th style="padding:8px;text-align:right;font-size:13px">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 8px;font-weight:bold">Total</td>
              <td style="padding:12px 8px;font-weight:bold;text-align:right;color:#FF9900">
                $${order.total_amount.toFixed(2)} ${order.currency}
              </td>
            </tr>
          </tfoot>
        </table>

        <h3 style="color:#12332E;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:24px">Shipping To</h3>
        <p style="margin:4px 0">${order.shipping_name}</p>
        <p style="margin:4px 0">${order.shipping_address}</p>
        <p style="margin:4px 0">${order.shipping_city}, ${order.shipping_province} ${order.shipping_zip}</p>
        <p style="margin:4px 0">${order.shipping_country}</p>

        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:24px 0">
          <p style="margin:0;font-size:14px">
            📦 <strong>What's next?</strong> Your order is being processed by our supplier. 
            You'll receive tracking information once your package ships (typically 2-5 business days).
          </p>
        </div>

        <p>Questions? Reply to this email or visit <a href="https://exceptionel.com/contact" style="color:#FF9900">exceptionel.com</a></p>
      </div>

      <div style="text-align:center;padding:16px;border-top:1px solid #eee;font-size:12px;color:#999">
        <p>© ${new Date().getFullYear()} Exceptionel. All rights reserved.</p>
        <p>USA & Canada</p>
      </div>
    </body>
    </html>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Exceptionel <orders@exceptionel.com>',
      to: order.shipping_email,
      subject: `Order Confirmed — #${order.id.slice(-8).toUpperCase()}`,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[Email] Send failed:', data);
  } else {
    console.log('[Email] Confirmation sent to', order.shipping_email);
  }

  return data;
}

export async function sendShippingNotification({ order, trackingNumber, trackingUrl }) {
  if (!process.env.RESEND_API_KEY) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
      <div style="text-align:center;padding:20px 0;border-bottom:3px solid #FF9900">
        <h1 style="color:#12332E;margin:0">Exceptionel</h1>
      </div>
      <div style="padding:24px 0">
        <h2>Your order is on its way! 🚚</h2>
        <p>Hi <strong>${order.shipping_name}</strong>,</p>
        <p>Great news — your order has been shipped!</p>
        
        <div style="background:#f0fdf4;border:1px solid #22c55e;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
          <p style="margin:0;font-size:13px;color:#666">Tracking Number</p>
          <p style="margin:8px 0;font-size:20px;font-weight:bold;font-family:monospace">${trackingNumber}</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="background:#FF9900;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:8px">Track Package</a>` : ''}
        </div>

        <p>Estimated delivery: <strong>7-15 business days</strong></p>
        <p>Questions? Visit <a href="https://exceptionel.com" style="color:#FF9900">exceptionel.com</a></p>
      </div>
    </body>
    </html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Exceptionel <orders@exceptionel.com>',
      to: order.shipping_email,
      subject: `Your order has shipped! 🚚 #${order.id.slice(-8).toUpperCase()}`,
      html,
    }),
  });
}
