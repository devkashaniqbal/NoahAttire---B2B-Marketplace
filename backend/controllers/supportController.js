const SupportTicket = require('../models/SupportTicket');

exports.createTicket = async (req, res, next) => {
  try {
    const { subject, category, description, orderId } = req.body;
    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    const ticket = await SupportTicket.create({
      buyerId: req.user.userId,
      subject: subject.trim(),
      category: SupportTicket.CATEGORIES.includes(category) ? category : 'other',
      description: description.trim(),
      orderId: orderId || null,
    });

    res.status(201).json({ ticket, message: 'Support ticket raised' });
  } catch (err) {
    next(err);
  }
};

exports.getMyTickets = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { buyerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('orderId', 'title totalAmount')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      SupportTicket.countDocuments(query),
    ]);

    res.json({ tickets, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.getTicket = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, buyerId: req.user.userId };
    const ticket = await SupportTicket.findOne(filter).populate('orderId', 'title totalAmount');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
};

exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!SupportTicket.STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket, message: 'Ticket status updated' });
  } catch (err) {
    next(err);
  }
};
