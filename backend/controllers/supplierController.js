const Supplier = require('../models/Supplier');

exports.getMySuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ sellerId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ suppliers });
  } catch (err) {
    next(err);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const { name, material, contactPhone, contactEmail, location, lastOrderDate, notes } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const supplier = await Supplier.create({
      sellerId: req.user.userId,
      name,
      material,
      contactPhone,
      contactEmail,
      location,
      lastOrderDate: lastOrderDate || null,
      notes,
    });

    res.status(201).json({ supplier, message: 'Supplier added' });
  } catch (err) {
    next(err);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Supplier not found or unauthorized' });
    res.json({ supplier, message: 'Supplier updated' });
  } catch (err) {
    next(err);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, sellerId: req.user.userId });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found or unauthorized' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
};
