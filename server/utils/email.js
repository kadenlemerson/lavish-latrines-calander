const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

function getTransporter() {
  if (!process.env.EMAIL_USER) {
    console.warn('⚠ Email not configured - set EMAIL_USER and EMAIL_PASS in .env');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function formatCurrency(amount) {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
}

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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; color: #C9A84C; }
    .header p { margin: 8px 0 0; color: #ccc; font-size: 14px; letter-spacing: 1px; }
    .body { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1a1a1a; margin-bottom: 20px; }
    .detail-card { background: #f9f6f0; border-left: 4px solid #C9A84C; border-radius: 4px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 15px; }
    .detail-label { color: #666; }
    .detail-value { font-weight: bold; color: #1a1a1a; }
    .amount-box { background: #1a1a1a; color: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .amount-box .label { color: #C9A84C; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
    .amount-box .amount { font-size: 32px; font-weight: bold; margin: 8px 0; }
    .footer { background: #f5f0e8; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #e0d8c8; }
    .gold { color: #C9A84C; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LAVISH LATRINES</h1>
      <p>Luxury Portable Restroom Rentals</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${customer.name},</p>
      <p>Thank you for choosing Lavish Latrines! Your booking is confirmed. We're excited to provide luxury restroom service for your event.</p>

      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">Booking Reference</span>
          <span class="detail-value">#LL-${String(booking.id).padStart(4, '0')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date</span>
          <span class="detail-value">${formatDate(booking.event_date)}</span>
        </div>
        ${booking.event_type ? `
        <div class="detail-row">
          <span class="detail-label">Event Type</span>
          <span class="detail-value">${booking.event_type}</span>
        </div>` : ''}
        ${booking.location ? `
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="detail-value">${booking.location}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Trailer</span>
          <span class="detail-value">Unit #${booking.trailer_number}</span>
        </div>
      </div>

      <div class="amount-box">
        <div class="label">Deposit Received</div>
        <div class="amount">${formatCurrency(booking.deposit_amount)}</div>
        <div style="color: #ccc; font-size: 13px;">Balance Due at Delivery: ${formatCurrency(booking.balance_due)}</div>
      </div>

      <p>Your invoice is attached to this email. If you have any questions, please don't hesitate to contact us.</p>
      <p>We look forward to making your event spectacular!</p>
      <p class="gold">— The Lavish Latrines Team</p>
    </div>
    <div class="footer">
      <p>Lavish Latrines | Vancouver, WA</p>
      <p>Questions? Reply to this email or call us.</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Lavish Latrines <noreply@lavishlatrines.com>',
    to: customer.email,
    subject: `Booking Confirmed - Lavish Latrines #LL-${String(booking.id).padStart(4, '0')}`,
    html,
    attachments
  });
}

async function sendQuoteConfirmation(quote) {
  const transporter = getTransporter();
  if (!transporter) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: #1a1a1a; color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; color: #C9A84C; }
    .body { padding: 40px 30px; }
    .footer { background: #f5f0e8; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LAVISH LATRINES</h1>
    </div>
    <div class="body">
      <p>Dear ${quote.name},</p>
      <p>We've received your quote request! Our team will review the details and get back to you within 1-2 business days with a custom quote.</p>
      <p><strong>Your request summary:</strong><br>
      Dates: ${formatDate(quote.requested_start)}${quote.requested_end ? ' – ' + formatDate(quote.requested_end) : ''}<br>
      Trailers: ${quote.num_trailers}<br>
      Event: ${quote.event_type || 'Not specified'}</p>
      <p>Thank you for considering Lavish Latrines for your event!</p>
    </div>
    <div class="footer">Lavish Latrines | Vancouver, WA</div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Lavish Latrines <noreply@lavishlatrines.com>',
    to: quote.email,
    subject: 'Quote Request Received - Lavish Latrines',
    html
  });
}

module.exports = { sendBookingConfirmation, sendQuoteConfirmation };
