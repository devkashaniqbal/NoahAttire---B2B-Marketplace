const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const userStore = require('../utils/userStore');
const cloudinary = require('../utils/cloudinary');
const { buildInvoicePdfBuffer } = require('../utils/invoicePdf');

async function nextInvoiceNumber() {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await Invoice.countDocuments({ invoiceNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find()
        .populate('orderId', 'title')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Invoice.countDocuments(),
    ]);
    const hydrated = await userStore.hydrate(invoices, ['buyerId', 'sellerId']);
    res.json({ invoices: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.generateInvoice = async (req, res, next) => {
  try {
    const { taxPercent = 0 } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const [buyer, seller] = await Promise.all([
      userStore.getUserProfile(order.buyerId),
      userStore.getUserProfile(order.sellerId),
    ]);

    const existing = await Invoice.findOne({ orderId: order._id });
    if (existing) return res.status(400).json({ message: 'Invoice already generated for this order', invoice: existing });

    const unitPrice = order.quantity ? order.totalAmount / order.quantity : order.totalAmount;
    const items = [{
      description: order.title,
      quantity: order.quantity,
      unitPrice,
      total: order.totalAmount,
    }];
    const subtotal = order.totalAmount;
    const tax = Number(taxPercent) || 0;
    const taxAmount = (subtotal * tax) / 100;
    const total = subtotal + taxAmount;

    const invoiceNumber = await nextInvoiceNumber();
    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      items,
      subtotal,
      taxPercent: tax,
      taxAmount,
      total,
      createdBy: req.user.userId,
    });

    const pdfBuffer = await buildInvoicePdfBuffer(invoice, {
      buyerName: buyer?.name,
      buyerEmail: buyer?.email,
      sellerName: seller?.name,
      sellerEmail: seller?.email,
    });

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'b2b-marketplace/invoices', resource_type: 'raw', public_id: invoiceNumber, format: 'pdf' },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(pdfBuffer);
      });
      invoice.pdfUrl = uploadResult.secure_url;
      await invoice.save();
    }

    const whatsappText = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber} for "${order.title}" — Total: $${total.toFixed(2)}.${invoice.pdfUrl ? ` View/download: ${invoice.pdfUrl}` : ''}`
    );

    res.status(201).json({
      invoice,
      whatsappShareLink: `https://wa.me/?text=${whatsappText}`,
      message: 'Invoice generated',
    });
  } catch (err) {
    next(err);
  }
};

exports.getInvoiceByOrder = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ orderId: req.params.orderId, buyerId: req.user.userId });
    if (!invoice) return res.status(404).json({ message: 'No invoice found for this order yet' });
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
};

exports.downloadMyInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, buyerId: req.user.userId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const [buyer, seller] = await Promise.all([
      userStore.getUserProfile(invoice.buyerId),
      userStore.getUserProfile(invoice.sellerId),
    ]);
    const pdfBuffer = await buildInvoicePdfBuffer(invoice, {
      buyerName: buyer?.name,
      buyerEmail: buyer?.email,
      sellerName: seller?.name,
      sellerEmail: seller?.email,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

exports.downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const [buyer, seller] = await Promise.all([
      userStore.getUserProfile(invoice.buyerId),
      userStore.getUserProfile(invoice.sellerId),
    ]);
    const pdfBuffer = await buildInvoicePdfBuffer(invoice, {
      buyerName: buyer?.name,
      buyerEmail: buyer?.email,
      sellerName: seller?.name,
      sellerEmail: seller?.email,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
