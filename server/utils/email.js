const nodemailer = require('nodemailer');
const fs = require('fs');

function getTransporter() {
  if (!process.env.EMAIL_USER) {
    console.warn('⚠ Email not configured — set EMAIL_USER and EMAIL_PASS in .env');
    return null;
  }
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

function fmt(n) {
  return `$${parseFloat(n || 0).toFixed(2)}`;
}

// ── Customer booking confirmation ────────────────────────────────────────────

async function sendBookingConfirmation(booking, customer, invoicePath) {
  const transporter = getTransporter();
  if (!transporter) return;

  const attachments = [];
  if (invoicePath && fs.existsSync(invoicePath)) {
    attachments.push({
      filename: `Lavish-Latrines-Invoice-${booking.id}.pdf`,
      path: invoicePath,
      contentType: 'application/pdf'
    });
  }

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:Georgia,serif;background:#f5f0e8;margin:0;padding:20px}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
  .hd{background:linear-gradient(135deg,#1a1a1a,#2c2c2c);color:#fff;padding:40px 30px;text-align:center}
  .hd h1{margin:0;font-size:28px;letter-spacing:2px;color:#C9A84C}
  .hd p{margin:8px 0 0;color:#ccc;font-size:14px;letter-spacing:1px}
  .bd{padding:40px 30px}
  .card{background:#f9f6f0;border-left:4px solid #C9A84C;border-radius:4px;padding:20px;margin:20px 0}
  .row{display:flex;justify-content:space-between;margin:8px 0;font-size:15px}
  .lbl{color:#666}.val{font-weight:bold;color:#1a1a1a}
  .amt{background:#1a1a1a;color:#fff;border-radius:8px;padding:20px;margin:20px 0;text-align:center}
  .amt .albl{color:#C9A84C;font-size:12px;letter-spacing:1px;text-transform:uppercase}
  .amt .aval{font-size:32px;font-weight:bold;margin:8px 0}
  .ft{background:#f5f0e8;padding:20px 30px;text-align:center;color:#888;font-size:12px;border-top:1px solid #e0d8c8}
</style></head><body>
<div class="wrap">
  <div class="hd"><h1>LAVISH LATRINES</h1><p>Luxury Portable Restroom Rentals</p></div>
  <div class="bd">
    <p style="font-size:18px;color:#1a1a1a">Dear ${customer.name},</p>
    <p>Thank you for choosing Lavish Latrines! Your booking is confirmed.</p>
    <div class="card">
      <div class="row"><span class="lbl">Booking Ref</span><span class="val">#LL-${String(booking.id).padStart(4,'0')}</span></div>
      <div class="row"><span class="lbl">Event Date</span><span class="val">${formatDate(booking.event_date)}</span></div>
      ${booking.event_type ? `<div class="row"><span class="lbl">Event Type</span><span class="val">${booking.event_type}</span></div>` : ''}
      ${booking.location ? `<div class="row"><span class="lbl">Location</span><span class="val">${booking.location}</span></div>` : ''}
      <div class="row"><span class="lbl">Trailer</span><span class="val">Unit #${booking.trailer_number}</span></div>
    </div>
    <div class="amt">
      <div class="albl">Deposit Received</div>
      <div class="aval">${fmt(booking.deposit_amount)}</div>
      <div style="color:#ccc;font-size:13px">Balance Due at Delivery: ${fmt(booking.balance_due)}</div>
    </div>
    <p>Your invoice is attached. The balance of <strong>${fmt(booking.balance_due)}</strong> is due upon delivery.</p>
    <p style="color:#C9A84C">— The Lavish Latrines Team</p>
  </div>
  <div class="ft"><p>Lavish Latrines | Vancouver, WA</p></div>
</div></body></html>`;

  await transporter.sendMail({
    from:        process.env.EMAIL_FROM || 'Lavish Latrines <noreply@lavishlatrines.com>',
    to:          customer.email,
    subject:     `Booking Confirmed — Lavish Latrines #LL-${String(booking.id).padStart(4,'0')}`,
    html,
    attachments
  });
}

// ── Admin notification: new booking ─────────────────────────────────────────

async function sendAdminBookingNotification(booking, customer) {
  const transporter = getTransporter();
  const adminEmail  = process.env.ADMIN_NOTIFY_EMAIL;
  if (!transporter || !adminEmail) return;

  const rows = [
    ['Booking Ref',       `#LL-${String(booking.id).padStart(4,'0')}`],
    ['Event Date',        formatDate(booking.event_date)],
    ['Event Type',        booking.event_type  || '—'],
    ['Location',          booking.location    || '—'],
    ['Venue Address',     booking.location_address || booking.address_details || '—'],
    ['Trailer',           `Unit #${booking.trailer_number}`],
    ['--- Customer ---',  ''],
    ['Name',              customer.name],
    ['Email',             customer.email],
    ['Phone',             customer.phone      || '—'],
    ['Address',           [customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ') || '—'],
    ['--- Event Details ---', ''],
    ['Water Access',      booking.water_access    || '—'],
    ['Power Access',      booking.power_access    || '—'],
    ['Expected Guests',   booking.expected_guests || '—'],
    ['--- Payment ---',   ''],
    ['Base Price',        fmt(booking.base_price)],
    ['Deposit',           fmt(booking.deposit_amount)],
    ['Deposit Paid',      booking.deposit_paid ? 'Yes' : 'No'],
    ['Balance Due',       fmt(booking.balance_due)],
    ['Payment Status',    booking.payment_status || '—'],
    ['--- Notes ---',     ''],
    ['Notes',             booking.notes           || '—'],
  ];

  const tableRows = rows.map(([l, v]) =>
    l.startsWith('---')
      ? `<tr><td colspan="2" style="padding:8px 0 4px;font-weight:bold;color:#C9A84C;border-top:1px solid #e0d8c8;font-size:12px;text-transform:uppercase;letter-spacing:1px">${l.replace(/---/g,'').trim()}</td></tr>`
      : `<tr><td style="padding:5px 12px 5px 0;color:#666;font-size:14px;white-space:nowrap">${l}</td><td style="padding:5px 0;font-weight:600;font-size:14px;color:#1a1a1a">${v}</td></tr>`
  ).join('');

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Georgia,serif;background:#f5f0e8;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
  <div style="background:linear-gradient(135deg,#1a1a1a,#2c2c2c);padding:24px 30px">
    <h1 style="margin:0;font-size:20px;color:#C9A84C;letter-spacing:2px">NEW BOOKING RECEIVED</h1>
    <p style="margin:6px 0 0;color:#ccc;font-size:13px">Lavish Latrines · ${formatDate(booking.event_date)}</p>
  </div>
  <div style="padding:30px">
    <table style="width:100%;border-collapse:collapse">${tableRows}</table>
  </div>
  <div style="background:#f5f0e8;padding:16px 30px;text-align:center;color:#888;font-size:12px;border-top:1px solid #e0d8c8">
    Log in to your dashboard to view and manage this booking.
  </div>
</div></body></html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'Lavish Latrines <noreply@lavishlatrines.com>',
    to:      adminEmail,
    subject: `🆕 New Booking: ${customer.name} — ${formatDate(booking.event_date)}`,
    html
  });
}

// ── Admin notification: new quote request ────────────────────────────────────

async function sendAdminQuoteNotification(quote) {
  const transporter = getTransporter();
  const adminEmail  = process.env.ADMIN_NOTIFY_EMAIL;
  if (!transporter || !adminEmail) return;

  const rows = [
    ['Name',            quote.name],
    ['Email',           quote.email],
    ['Phone',           quote.phone           || '—'],
    ['Event Type',      quote.event_type      || '—'],
    ['Start Date',      formatDate(quote.requested_start)],
    ['End Date',        quote.requested_end ? formatDate(quote.requested_end) : '—'],
    ['Trailers',        String(quote.num_trailers)],
    ['Location',        quote.location        || '—'],
    ['Expected Guests', quote.estimated_guests || '—'],
    ['Water Access',    quote.water_access    || '—'],
    ['Power Access',    quote.power_access    || '—'],
    ['Notes',           quote.notes           || '—'],
  ];

  const tableRows = rows.map(([l, v]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#666;font-size:14px;white-space:nowrap">${l}</td><td style="padding:6px 0;font-weight:600;font-size:14px;color:#1a1a1a">${v}</td></tr>`
  ).join('');

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Georgia,serif;background:#f5f0e8;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
  <div style="background:linear-gradient(135deg,#1a1a1a,#2c2c2c);padding:24px 30px">
    <h1 style="margin:0;font-size:20px;color:#C9A84C;letter-spacing:2px">NEW QUOTE REQUEST</h1>
    <p style="margin:6px 0 0;color:#ccc;font-size:13px">Lavish Latrines · ${formatDate(quote.requested_start)}</p>
  </div>
  <div style="padding:30px">
    <table style="width:100%;border-collapse:collapse">${tableRows}</table>
  </div>
  <div style="background:#f5f0e8;padding:16px 30px;text-align:center;color:#888;font-size:12px;border-top:1px solid #e0d8c8">
    Log in to your dashboard to review this quote request.
  </div>
</div></body></html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'Lavish Latrines <noreply@lavishlatrines.com>',
    to:      adminEmail,
    subject: `💬 New Quote Request: ${quote.name} — ${formatDate(quote.requested_start)}`,
    html
  });
}

// ── Customer quote confirmation ───────────────────────────────────────────────

async function sendQuoteConfirmation(quote) {
  const transporter = getTransporter();
  if (!transporter) return;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;background:#f5f0e8;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
  <div style="background:#1a1a1a;color:#fff;padding:40px 30px;text-align:center">
    <h1 style="margin:0;font-size:28px;letter-spacing:2px;color:#C9A84C">LAVISH LATRINES</h1>
  </div>
  <div style="padding:40px 30px">
    <p>Dear ${quote.name},</p>
    <p>We've received your quote request! Our team will review the details and get back to you within 1–2 business days.</p>
    <p><strong>Your request summary:</strong><br>
    Dates: ${formatDate(quote.requested_start)}${quote.requested_end ? ' – ' + formatDate(quote.requested_end) : ''}<br>
    Trailers: ${quote.num_trailers}<br>
    Event: ${quote.event_type || 'Not specified'}</p>
    <p>Thank you for considering Lavish Latrines!</p>
  </div>
  <div style="background:#f5f0e8;padding:16px 30px;text-align:center;color:#888;font-size:12px">Lavish Latrines | Vancouver, WA</div>
</div></body></html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'Lavish Latrines <noreply@lavishlatrines.com>',
    to:      quote.email,
    subject: 'Quote Request Received — Lavish Latrines',
    html
  });
}

module.exports = {
  sendBookingConfirmation,
  sendAdminBookingNotification,
  sendAdminQuoteNotification,
  sendQuoteConfirmation
};
