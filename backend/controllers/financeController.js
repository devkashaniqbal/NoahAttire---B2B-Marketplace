const Expense = require('../models/Expense');
const Order = require('../models/Order');
const userStore = require('../utils/userStore');

exports.getExpenses = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('orderId', 'title')
        .skip(skip)
        .limit(Number(limit))
        .sort({ date: -1 }),
      Expense.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(expenses, ['createdBy']);

    res.json({ expenses: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { category, description, amount, date, orderId } = req.body;
    if (!Expense.CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid expense category' });
    }
    if (!description?.trim()) return res.status(400).json({ message: 'Description is required' });
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    const expense = await Expense.create({
      category,
      description: description.trim(),
      amount: amt,
      date: date ? new Date(date) : new Date(),
      orderId: orderId || null,
      createdBy: req.user.userId,
    });
    res.status(201).json({ expense, message: 'Expense recorded' });
  } catch (err) {
    next(err);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const { category, description, amount, date } = req.body;
    const update = {};
    if (category !== undefined) {
      if (!Expense.CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
      update.category = category;
    }
    if (description !== undefined) update.description = description.trim();
    if (amount !== undefined) update.amount = Number(amount);
    if (date !== undefined) update.date = new Date(date);

    const expense = await Expense.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ expense, message: 'Expense updated' });
  } catch (err) {
    next(err);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      revenueAgg, expensesByCategoryAgg, monthExpenseAgg, trendOrdersAgg, trendExpensesAgg,
      todayRevenueAgg, todayExpenseAgg,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, expenses: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const revenue = revenueAgg[0]?.revenue || 0;
    const totalExpenses = monthExpenseAgg[0]?.total || 0;
    const todayRevenue = todayRevenueAgg[0]?.revenue || 0;
    const todayExpenses = todayExpenseAgg[0]?.total || 0;
    const categoryMap = {};
    expensesByCategoryAgg.forEach(({ _id, total }) => { categoryMap[_id] = total; });

    const trendMap = {};
    trendOrdersAgg.forEach((d) => { trendMap[d._id] = { date: d._id, revenue: d.revenue, expenses: 0 }; });
    trendExpensesAgg.forEach((d) => {
      if (!trendMap[d._id]) trendMap[d._id] = { date: d._id, revenue: 0, expenses: 0 };
      trendMap[d._id].expenses = d.expenses;
    });
    const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      summary: {
        revenue,
        totalExpenses,
        profit: revenue - totalExpenses,
        today: {
          revenue: todayRevenue,
          expenses: todayExpenses,
          profit: todayRevenue - todayExpenses,
        },
        expensesByCategory: {
          material: categoryMap.material || 0,
          labor: categoryMap.labor || 0,
          electricity: categoryMap.electricity || 0,
          delivery: categoryMap.delivery || 0,
          other: categoryMap.other || 0,
        },
        trend: trend.map((d) => ({ ...d, profit: d.revenue - d.expenses })),
      },
    });
  } catch (err) {
    next(err);
  }
};
