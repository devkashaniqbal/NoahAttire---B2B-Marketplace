const PDFDocument = require('pdfkit');

function buildInvoicePdfBuffer(invoice, { buyerName, buyerEmail, sellerName, sellerEmail }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#1800AD').fontSize(22).font('Helvetica-Bold').text('NoahAttire', 50, 50);
    doc.fillColor('#666').fontSize(10).font('Helvetica').text('B2B Manufacturing & Export', 50, 76);

    doc.fillColor('#1800AD').fontSize(18).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.fillColor('#333').fontSize(10).font('Helvetica')
      .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 76, { align: 'right' })
      .text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, 400, 90, { align: 'right' });

    doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#E5E7EB').stroke();

    doc.fillColor('#999').fontSize(9).font('Helvetica-Bold').text('FROM', 50, 130);
    doc.fillColor('#111').fontSize(11).font('Helvetica').text(sellerName || 'Seller', 50, 144);
    doc.fillColor('#666').fontSize(10).text(sellerEmail || '', 50, 160);

    doc.fillColor('#999').fontSize(9).font('Helvetica-Bold').text('BILL TO', 320, 130);
    doc.fillColor('#111').fontSize(11).font('Helvetica').text(buyerName || 'Buyer', 320, 144);
    doc.fillColor('#666').fontSize(10).text(buyerEmail || '', 320, 160);

    let y = 200;
    doc.rect(50, y, 500, 24).fill('#1800AD');
    doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 60, y + 7);
    doc.text('Qty', 320, y + 7, { width: 50, align: 'right' });
    doc.text('Unit Price', 380, y + 7, { width: 80, align: 'right' });
    doc.text('Total', 470, y + 7, { width: 70, align: 'right' });

    y += 24;
    doc.fillColor('#111').font('Helvetica').fontSize(10);
    invoice.items.forEach((item) => {
      doc.rect(50, y, 500, 22).strokeColor('#E5E7EB').stroke();
      doc.text(item.description, 60, y + 6, { width: 250 });
      doc.text(String(item.quantity), 320, y + 6, { width: 50, align: 'right' });
      doc.text(`$${item.unitPrice.toFixed(2)}`, 380, y + 6, { width: 80, align: 'right' });
      doc.text(`$${item.total.toFixed(2)}`, 470, y + 6, { width: 70, align: 'right' });
      y += 22;
    });

    y += 16;
    doc.font('Helvetica').fontSize(10).fillColor('#444');
    doc.text('Subtotal', 380, y, { width: 80, align: 'right' });
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 470, y, { width: 70, align: 'right' });
    y += 16;
    if (invoice.taxPercent > 0) {
      doc.text(`Tax (${invoice.taxPercent}%)`, 380, y, { width: 80, align: 'right' });
      doc.text(`$${invoice.taxAmount.toFixed(2)}`, 470, y, { width: 70, align: 'right' });
      y += 16;
    }
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1800AD');
    doc.text('Total', 380, y, { width: 80, align: 'right' });
    doc.text(`$${invoice.total.toFixed(2)}`, 470, y, { width: 70, align: 'right' });

    y += 50;
    doc.font('Helvetica').fontSize(9).fillColor('#999')
      .text('Thank you for your business. This invoice was generated automatically by NoahAttire.', 50, y, { width: 500, align: 'center' });

    doc.end();
  });
}

module.exports = { buildInvoicePdfBuffer };
