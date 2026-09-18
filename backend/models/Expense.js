const mongoose = require('mongoose');

const CATEGORIES = ['material', 'labor', 'electricity', 'delivery', 'other'];

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    createdBy: { type: String, required: true  },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;
