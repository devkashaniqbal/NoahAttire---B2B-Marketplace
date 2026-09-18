const nodemailer = require('nodemailer');

const emailEnabled = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradeHub B2B</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px 0;">
    <!-- Header -->
    <div style="background-color:#0F2557;padding:28px 40px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#C9A84C;margin:0;font-size:26px;font-weight:700;letter-spacing:1.5px;">TradeHub B2B</h1>
      <p style="color:#B0BFD8;margin:6px 0 0;font-size:13px;">Business-to-Business Marketplace</p>
    </div>
    <!-- Body -->
    <div style="background-color:#ffffff;padding:36px 40px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background-color:#0F2557;padding:18px 40px;border-radius:0 0 8px 8px;text-align:center;">
      <p style="color:#6B7A99;font-size:12px;margin:0;">
        © ${new Date().getFullYear()} TradeHub B2B. All rights reserved.<br>
        <span style="color:#4B5A78;">This is an automated notification — please do not reply to this email.</span>
      </p>
    </div>
  </div>
</body>
</html>
`;

exports.sendInquiryNotificationToSeller = async ({
  sellerEmail,
  sellerName,
  productTitle,
  buyerName,
  buyerEmail,
  buyerPhone,
  message,
  quantity,
}) => {
  if (!emailEnabled) {
    console.log(`[EMAIL SKIP] Seller notification → ${sellerEmail} (EMAIL_USER not configured)`);
    return;
  }
  const content = `
    <h2 style="color:#0F2557;margin-top:0;font-size:22px;">New Inquiry Received</h2>
    <p style="color:#4B5563;line-height:1.7;margin-bottom:20px;">
      Hello <strong>${sellerName}</strong>,<br>
      You have received a new buyer inquiry for your product listed on TradeHub B2B.
    </p>

    <div style="background-color:#EFF3FB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
      <p style="color:#0F2557;font-weight:700;font-size:15px;margin:0 0 12px;">
        Product: ${productTitle}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:7px 0;color:#6B7280;width:130px;">Buyer Name</td>
          <td style="padding:7px 0;color:#111827;font-weight:600;">${buyerName}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#6B7280;">Email</td>
          <td style="padding:7px 0;color:#111827;">${buyerEmail}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#6B7280;">Phone</td>
          <td style="padding:7px 0;color:#111827;">${buyerPhone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#6B7280;">Quantity</td>
          <td style="padding:7px 0;color:#111827;">${quantity || 'Not specified'}</td>
        </tr>
      </table>
    </div>

    <div style="background-color:#F9FAFB;border-left:4px solid #C9A84C;border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#374151;font-size:14px;font-weight:600;margin:0 0 8px;">Message from Buyer</p>
      <p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0;">${message}</p>
    </div>

    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.FRONTEND_URL}/seller/inquiries"
        style="background-color:#0F2557;color:#ffffff;padding:13px 32px;border-radius:6px;
               text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        View &amp; Manage Inquiries
      </a>
    </div>

    <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:28px;">
      You can also reply to the buyer directly at <a href="mailto:${buyerEmail}" style="color:#C9A84C;">${buyerEmail}</a>
    </p>
  `;

  await transporter.sendMail({
    from: `"TradeHub B2B" <${process.env.EMAIL_USER}>`,
    to: sellerEmail,
    subject: `New Inquiry: ${productTitle} — TradeHub B2B`,
    html: baseTemplate(content),
  });
};

exports.sendSellerReplyToBuyer = async ({
  buyerEmail,
  buyerName,
  sellerName,
  productTitle,
  originalMessage,
  replyText,
}) => {
  if (!emailEnabled) {
    console.log(`[EMAIL SKIP] Seller reply → ${buyerEmail} (EMAIL_USER not configured)`);
    return;
  }
  const content = `
    <h2 style="color:#0F2557;margin-top:0;font-size:22px;">Response to Your Inquiry</h2>
    <p style="color:#4B5563;line-height:1.7;margin-bottom:20px;">
      Hello <strong>${buyerName}</strong>,<br>
      <strong>${sellerName}</strong> has responded to your inquiry about
      <strong>${productTitle}</strong>.
    </p>

    <div style="background-color:#EFF3FB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
      <p style="color:#0F2557;font-weight:700;font-size:13px;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">
        Seller's Response
      </p>
      <p style="color:#1F2937;font-size:15px;line-height:1.8;margin:0;white-space:pre-wrap;">${replyText}</p>
    </div>

    <div style="background-color:#F9FAFB;border-left:3px solid #D1D5DB;border-radius:0 6px 6px 0;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#9CA3AF;font-size:12px;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">
        Your Original Message
      </p>
      <p style="color:#6B7280;font-size:13px;line-height:1.7;margin:0;">${originalMessage}</p>
    </div>

    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.FRONTEND_URL}/products"
        style="background-color:#0F2557;color:#ffffff;padding:13px 32px;border-radius:6px;
               text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        Browse More Products
      </a>
    </div>

    <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:24px;">
      To continue the conversation, reply directly to the seller at
      <a href="mailto:${sellerName}" style="color:#C9A84C;">${sellerName}</a>
    </p>
  `;

  await transporter.sendMail({
    from: `"TradeHub B2B" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `Response from ${sellerName}: ${productTitle} — TradeHub B2B`,
    html: baseTemplate(content),
  });
};

exports.sendInquiryNotificationToAdmin = async ({
  adminEmail,
  productTitle,
  sellerName,
  sellerEmail,
  buyerName,
  buyerEmail,
  buyerPhone,
  message,
  quantity,
  inquiryId,
}) => {
  if (!emailEnabled) {
    console.log(`[EMAIL SKIP] Admin notification → ${adminEmail} (EMAIL_USER not configured)`);
    return;
  }
  const content = `
    <h2 style="color:#0F2557;margin-top:0;font-size:22px;">New Buyer Inquiry</h2>
    <p style="color:#4B5563;line-height:1.7;margin-bottom:20px;">
      A new inquiry has been submitted on the platform.
    </p>

    <div style="background-color:#EFF3FB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
      <p style="color:#0F2557;font-weight:700;font-size:15px;margin:0 0 12px;">
        Product: ${productTitle}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6B7280;width:130px;">Inquiry ID</td><td style="padding:6px 0;color:#111827;font-family:monospace;">${inquiryId}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Seller</td><td style="padding:6px 0;color:#111827;font-weight:600;">${sellerName} (${sellerEmail})</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Buyer Name</td><td style="padding:6px 0;color:#111827;font-weight:600;">${buyerName}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Buyer Email</td><td style="padding:6px 0;color:#111827;">${buyerEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Buyer Phone</td><td style="padding:6px 0;color:#111827;">${buyerPhone || 'Not provided'}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Quantity</td><td style="padding:6px 0;color:#111827;">${quantity || 'Not specified'}</td></tr>
      </table>
    </div>

    <div style="background-color:#F9FAFB;border-left:4px solid #C9A84C;border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#374151;font-size:14px;font-weight:600;margin:0 0 8px;">Buyer Message</p>
      <p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0;">${message}</p>
    </div>

    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.FRONTEND_URL}/admin/inquiries"
        style="background-color:#0F2557;color:#ffffff;padding:13px 32px;border-radius:6px;
               text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        View in Admin Dashboard
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"TradeHub B2B" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `[Admin] New Inquiry: ${productTitle} — TradeHub B2B`,
    html: baseTemplate(content),
  });
};

exports.sendInquiryConfirmationToBuyer = async ({
  buyerEmail,
  buyerName,
  productTitle,
  sellerName,
}) => {
  if (!emailEnabled) {
    console.log(`[EMAIL SKIP] Buyer confirmation → ${buyerEmail} (EMAIL_USER not configured)`);
    return;
  }
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:60px;height:60px;background-color:#E8F5E9;border-radius:50%;
                  margin:0 auto 14px;display:flex;align-items:center;justify-content:center;
                  font-size:28px;line-height:60px;">
        ✅
      </div>
      <h2 style="color:#0F2557;margin:0;font-size:22px;">Inquiry Submitted!</h2>
    </div>

    <p style="color:#4B5563;line-height:1.7;margin-bottom:20px;">
      Hello <strong>${buyerName}</strong>,<br>
      Your inquiry for <strong>${productTitle}</strong> has been successfully sent to
      <strong>${sellerName}</strong>. They will get back to you shortly.
    </p>

    <div style="background-color:#EFF3FB;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <h3 style="color:#0F2557;font-size:15px;margin:0 0 12px;">What Happens Next?</h3>
      <ul style="color:#4B5563;font-size:14px;line-height:2;padding-left:18px;margin:0;">
        <li>The seller will review your inquiry within 24–48 hours</li>
        <li>Expect a response via email or phone</li>
        <li>Discuss pricing, MOQ, and delivery terms directly</li>
        <li>Negotiate and finalize your order details</li>
      </ul>
    </div>

    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.FRONTEND_URL}/products"
        style="background-color:#0F2557;color:#ffffff;padding:13px 32px;border-radius:6px;
               text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        Browse More Products
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"TradeHub B2B" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `Inquiry Confirmed: ${productTitle} — TradeHub B2B`,
    html: baseTemplate(content),
  });
};

const STATUS_LABELS = {
  pending: 'Pending',
  'in-production': 'In Production',
  ready: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

exports.sendOrderStatusUpdateEmail = async ({
  buyerEmail,
  buyerName,
  productTitle,
  orderId,
  status,
  trackingNumber,
  carrier,
}) => {
  if (!emailEnabled) {
    console.log(`[EMAIL SKIP] Order status update → ${buyerEmail} (EMAIL_USER not configured)`);
    return;
  }
  const statusLabel = STATUS_LABELS[status] || status;
  const content = `
    <h2 style="color:#0F2557;margin-top:0;font-size:22px;">Order Status Updated</h2>
    <p style="color:#4B5563;line-height:1.7;margin-bottom:20px;">
      Hello <strong>${buyerName}</strong>,<br>
      Your order for <strong>${productTitle}</strong> has been updated.
    </p>

    <div style="background-color:#EFF3FB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:7px 0;color:#6B7280;width:130px;">Order ID</td>
          <td style="padding:7px 0;color:#111827;font-family:monospace;">${orderId}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#6B7280;">New Status</td>
          <td style="padding:7px 0;color:#111827;font-weight:700;">${statusLabel}</td>
        </tr>
        ${trackingNumber ? `
        <tr>
          <td style="padding:7px 0;color:#6B7280;">Tracking Number</td>
          <td style="padding:7px 0;color:#111827;">${trackingNumber}${carrier ? ` (${carrier})` : ''}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.FRONTEND_URL}/buyer/orders"
        style="background-color:#0F2557;color:#ffffff;padding:13px 32px;border-radius:6px;
               text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        Track Your Order
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"TradeHub B2B" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `Order Update: ${statusLabel} — TradeHub B2B`,
    html: baseTemplate(content),
  });
};
