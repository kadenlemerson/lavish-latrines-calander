const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const INVOICES_DIR = path.join(__dirname, '../invoices');

function ensureDir() {
  if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function formatCurrency(amount) {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
}

async function generateInvoicePDF(booking, customer) {
  ensureDir();
  const filename = `invoice-${booking.id}-${Date.now()}.pdf`;
  const filepath = path.join(INVOICES_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // ── Header Background ──
    doc.rect(0, 0, 612, 130).fill('#1a1a1a');

    // Company name
    doc.fillColor('#C9A84C')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('LAVISH LATRINES', 50, 40, { align: 'left' });

    doc.fillColor('#cccccc')
       .fontSize(11)
       .font('Helvetica')
       .text('Luxury Portable Restroom Rentals', 50, 74);

    doc.fillColor('#cccccc')
       .fontSize(10)
       .text('Vancouver, WA', 50, 90);

    // INVOICE title
    doc.fillColor('#ffffff')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('INVOICE', 400, 40, { align: 'right' });

    doc.fillColor('#C9A84C')
       .fontSize(12)
       .font('Helvetica')
       .text(`#LL-${String(booking.id).padStart(4, '0')}`, 400, 74, { align: 'right' });

    doc.fillColor('#cccccc')
       .fontSize(10)
       .text(`Issued: ${formatDate(new Date().toISOString().split('T')[0])}`, 400, 90, { align: 'right' });

    // ── Bill To ──
    doc.fillColor('#1a1a1a')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('BILL TO', 50, 155);

    doc.rect(50, 165, 200, 1).fill('#C9A84C');

    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(customer.name, 50, 175);

    doc.fillColor('#555555')
       .fontSize(10)
       .font('Helvetica')
       .text(customer.email, 50, 191)
       .text(customer.phone || '', 50, 205);

    if (customer.address) {
      doc.text(`${customer.address}`, 50, 219);
      if (customer.city) {
        doc.text(`${customer.city}${customer.state ? ', ' + customer.state : ''} ${customer.zip || ''}`, 50, 233);
      }
    }

    // ── Event Details ──
    doc.fillColor('#1a1a1a')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('EVENT DETAILS', 350, 155);

    doc.rect(350, 165, 210, 1).fill('#C9A84C');

    const eventDetails = [
      ['Event Date', formatDate(booking.event_date)],
      ['Event Type', booking.event_type || 'N/A'],
      ['Location', booking.location || 'TBD'],
      ['Trailer Unit', `#${booking.trailer_number}`]
    ];

    let ey = 175;
    eventDetails.forEach(([label, value]) => {
      doc.fillColor('#888888').fontSize(9).font('Helvetica').text(label, 350, ey);
      doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica-Bold').text(value, 440, ey);
      ey += 15;
    });

    // ── Line Items Table ──
    const tableTop = 310;

    // Table header
    doc.rect(50, tableTop, 510, 28).fill('#1a1a1a');
    doc.fillColor('#C9A84C').fontSize(10).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 60, tableTop + 9);
    doc.text('QTY', 360, tableTop + 9, { width: 50, align: 'center' });
    doc.text('RATE', 420, tableTop + 9, { width: 70, align: 'right' });
    doc.text('AMOUNT', 490, tableTop + 9, { width: 60, align: 'right' });

    // Line item
    doc.rect(50, tableTop + 28, 510, 35).fill('#f9f6f0');
    doc.fillColor('#1a1a1a').fontSize(11).font('Helvetica-Bold')
       .text('Luxury Restroom Trailer Rental', 60, tableTop + 38);
    doc.fillColor('#666666').fontSize(9).font('Helvetica')
       .text(`Event: ${formatDate(booking.event_date)}`, 60, tableTop + 52);
    doc.fillColor('#333333').fontSize(11).font('Helvetica')
       .text('1', 360, tableTop + 43, { width: 50, align: 'center' })
       .text(formatCurrency(booking.base_price), 420, tableTop + 43, { width: 70, align: 'right' })
       .text(formatCurrency(booking.base_price), 490, tableTop + 43, { width: 60, align: 'right' });

    // Totals section
    const totalsY = tableTop + 90;
    doc.rect(350, totalsY, 210, 1).fill('#ddd');

    const rows = [
      ['Subtotal', booking.base_price],
      ['Deposit Paid', -booking.deposit_amount],
    ];

    let ty = totalsY + 10;
    rows.forEach(([label, amount]) => {
      doc.fillColor('#555').fontSize(10).font('Helvetica').text(label, 350, ty);
      doc.fillColor('#333').fontSize(10).text(formatCurrency(Math.abs(amount)), 490, ty, { width: 60, align: 'right' });
      ty += 18;
    });

    // Balance Due box
    doc.rect(350, ty + 5, 210, 38).fill('#1a1a1a');
    doc.fillColor('#C9A84C').fontSize(10).font('Helvetica-Bold')
       .text('BALANCE DUE', 360, ty + 13);
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
       .text(formatCurrency(booking.balance_due), 440, ty + 11, { width: 110, align: 'right' });

    // ── Payment Status ──
    const statusY = ty + 60;
    const isPaid = booking.deposit_paid;
    doc.rect(50, statusY, 510, 40).fill(isPaid ? '#f0faf0' : '#fff8e7');
    doc.fillColor(isPaid ? '#2d7a2d' : '#b8860b')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(isPaid ? '✓ DEPOSIT RECEIVED' : '⏳ DEPOSIT PENDING', 60, statusY + 13);
    doc.fillColor('#666')
       .fontSize(9)
       .font('Helvetica')
       .text(isPaid ? `Deposit of ${formatCurrency(booking.deposit_amount)} paid successfully.` : 'Please pay deposit to confirm your booking.', 60, statusY + 27);

    // ── Contract Status ──
    if (booking.contract_signed) {
      doc.fillColor('#2d7a2d').fontSize(9)
         .text(`✓ Contract digitally signed on ${formatDate(booking.signed_at?.split('T')[0])}`, 60, statusY + 42);
    }

    // ── Footer ──
    doc.rect(0, 720, 612, 72).fill('#f5f0e8');
    doc.fillColor('#C9A84C').fontSize(14).font('Helvetica-Bold')
       .text('Thank you for choosing Lavish Latrines!', 0, 730, { align: 'center' });
    doc.fillColor('#888').fontSize(9).font('Helvetica')
       .text('Payment is due in full prior to the event date. The balance is due upon delivery.', 50, 748, { align: 'center', width: 510 });
    doc.fillColor('#aaa').fontSize(8)
       .text('Lavish Latrines | Vancouver, WA | lavishlatrines.com', 50, 762, { align: 'center', width: 510 });

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

module.exports = { generateInvoicePDF };
