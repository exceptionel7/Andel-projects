import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Send via Resend if configured
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Exceptionel Contact <noreply@exceptionel.com>',
          to: 'exceptionel7@gmail.com',
          reply_to: email,
          subject: `[Contact] ${subject} — from ${name}`,
          html: `
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr/>
            <p>${message.replace(/\n/g, '<br/>')}</p>
          `,
        }),
      });
    } else {
      // Log if Resend not configured
      console.log('[Contact]', { name, email, subject, message });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
