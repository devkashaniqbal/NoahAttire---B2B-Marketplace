const Inquiry = require('../models/Inquiry');
const Product = require('../models/Product');
const userStore = require('../utils/userStore');
const {
  sendInquiryNotificationToSeller,
  sendInquiryConfirmationToBuyer,
  sendInquiryNotificationToAdmin,
  sendSellerReplyToBuyer,
} = require('../utils/email');
const { sendPushNotification } = require('../config/firebaseAdmin');

exports.createInquiry = async (req, res, next) => {
  try {
    const { productId, buyerName, buyerEmail, buyerPhone, message, quantity } = req.body;

    if (req.user?.role === 'seller') {
      return res.status(403).json({ message: 'Seller accounts cannot send inquiries' });
    }

    if (!productId || !buyerName || !buyerEmail || !message) {
      return res.status(400).json({ message: 'Product, name, email, and message are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const inquiryData = {
      productId,
      sellerId: product.sellerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      message,
      quantity,
    };

    if (req.user) {
      inquiryData.buyerId = req.user.userId;
    }

    const inquiry = await Inquiry.create(inquiryData);

    const [seller, admins] = await Promise.all([
      userStore.getUserProfile(product.sellerId),
      userStore.listUsers({ role: 'admin' }),
    ]);
    const adminUser = admins[0] || null;

    const emailPayload = {
      productTitle: product.title,
      buyerName,
      buyerEmail,
      buyerPhone,
      message,
      quantity,
      inquiryId: inquiry._id,
    };

    try {
      const notifications = [
        sendInquiryNotificationToSeller({
          sellerEmail: seller.email,
          sellerName: seller.name,
          ...emailPayload,
        }),
        sendInquiryConfirmationToBuyer({
          buyerEmail,
          buyerName,
          productTitle: product.title,
          sellerName: seller.name,
        }),
      ];

      if (adminUser) {
        notifications.push(
          sendInquiryNotificationToAdmin({
            adminEmail: adminUser.email,
            sellerName: seller.name,
            sellerEmail: seller.email,
            ...emailPayload,
          })
        );
      }

      await Promise.all(notifications);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr.message);
    }

    // FCM push to seller
    if (seller?.fcmToken) {
      sendPushNotification({
        fcmToken: seller.fcmToken,
        title: 'New Inquiry Received',
        body: `${buyerName} is interested in "${product.title}"`,
        data: { inquiryId: inquiry._id.toString(), type: 'new_inquiry' },
      });
    }

    res.status(201).json({ inquiry, message: 'Inquiry submitted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getSellerInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { sellerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('productId', 'title images category')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Inquiry.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(inquiries, ['buyerId']);

    res.json({
      inquiries: hydrated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'in-progress', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, sellerId: req.user.userId };

    const inquiry = await Inquiry.findOneAndUpdate(filter, { status }, { new: true })
      .populate('productId', 'title');

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found or unauthorized' });
    res.json({ inquiry, message: 'Status updated' });
  } catch (err) {
    next(err);
  }
};

exports.replyToInquiry = async (req, res, next) => {
  try {
    const { replyText } = req.body;
    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, sellerId: req.user.userId };

    let inquiry = await Inquiry.findOneAndUpdate(
      filter,
      { sellerReply: replyText.trim(), repliedAt: new Date(), status: 'in-progress' },
      { new: true }
    ).populate('productId', 'title');

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found or unauthorized' });

    inquiry = await userStore.hydrate(inquiry, ['sellerId']);

    try {
      await sendSellerReplyToBuyer({
        buyerEmail: inquiry.buyerEmail,
        buyerName: inquiry.buyerName,
        sellerName: inquiry.sellerId?.name || 'The Seller',
        productTitle: inquiry.productId?.title || 'the product',
        originalMessage: inquiry.message,
        replyText: replyText.trim(),
      });
    } catch (emailErr) {
      console.error('Reply email failed:', emailErr.message);
    }

    // FCM push to buyer
    if (inquiry.buyerId) {
      const buyerProfile = await userStore.getUserProfile(inquiry.buyerId);
      if (buyerProfile?.fcmToken) {
        sendPushNotification({
          fcmToken: buyerProfile.fcmToken,
          title: 'Seller Replied to Your Inquiry',
          body: `${inquiry.sellerId?.name || 'Seller'} replied about "${inquiry.productId?.title}"`,
          data: { inquiryId: inquiry._id.toString(), type: 'seller_reply' },
        });
      }
    }

    res.json({ inquiry, message: 'Reply sent successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getBuyerInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { buyerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('productId', 'title images category')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Inquiry.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(inquiries, ['sellerId']);

    res.json({
      inquiries: hydrated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllInquiries = async (req, res, next) => {
  try {
    const { status, sellerId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (sellerId) query.sellerId = sellerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate('productId', 'title category')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Inquiry.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(inquiries, ['sellerId', 'buyerId']);

    res.json({
      inquiries: hydrated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};
