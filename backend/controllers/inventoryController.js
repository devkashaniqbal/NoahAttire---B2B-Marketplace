const RawMaterial = require('../models/RawMaterial');
const Product = require('../models/Product');
const userStore = require('../utils/userStore');

exports.getRawMaterials = async (req, res, next) => {
  try {
    const { lowStockOnly } = req.query;
    let query = {};
    if (lowStockOnly === 'true') {
      query = { $expr: { $lte: ['$quantity', '$lowStockThreshold'] } };
    }
    const materials = await RawMaterial.find(query).populate('supplierId', 'name').sort({ createdAt: -1 });
    res.json({ materials });
  } catch (err) {
    next(err);
  }
};

exports.createRawMaterial = async (req, res, next) => {
  try {
    const { name, unit, quantity, lowStockThreshold, costPerUnit, supplierId } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Material name is required' });

    const material = await RawMaterial.create({
      name: name.trim(),
      unit: unit?.trim() || 'meters',
      quantity: Number(quantity) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 50,
      costPerUnit: Number(costPerUnit) || 0,
      supplierId: supplierId || null,
      transactions: Number(quantity) > 0
        ? [{ type: 'in', quantity: Number(quantity), note: 'Initial stock' }]
        : [],
    });
    res.status(201).json({ material, message: 'Raw material added' });
  } catch (err) {
    next(err);
  }
};

exports.updateRawMaterial = async (req, res, next) => {
  try {
    const { name, unit, lowStockThreshold, costPerUnit, supplierId } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (unit !== undefined) update.unit = unit.trim();
    if (lowStockThreshold !== undefined) update.lowStockThreshold = Number(lowStockThreshold);
    if (costPerUnit !== undefined) update.costPerUnit = Number(costPerUnit);
    if (supplierId !== undefined) update.supplierId = supplierId || null;

    const material = await RawMaterial.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!material) return res.status(404).json({ message: 'Raw material not found' });
    res.json({ material, message: 'Raw material updated' });
  } catch (err) {
    next(err);
  }
};

exports.addTransaction = async (req, res, next) => {
  try {
    const { type, quantity, note } = req.body;
    if (!['in', 'out'].includes(type)) return res.status(400).json({ message: 'Type must be "in" or "out"' });
    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Quantity must be greater than 0' });

    const material = await RawMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Raw material not found' });

    if (type === 'out' && qty > material.quantity) {
      return res.status(400).json({ message: `Only ${material.quantity} ${material.unit} available` });
    }

    material.quantity += type === 'in' ? qty : -qty;
    material.transactions.push({ type, quantity: qty, note: note?.trim() || '' });
    await material.save();

    res.json({ material, message: `Stock ${type === 'in' ? 'added' : 'removed'}` });
  } catch (err) {
    next(err);
  }
};

exports.deleteRawMaterial = async (req, res, next) => {
  try {
    const material = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ message: 'Raw material not found' });
    res.json({ message: 'Raw material deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getFinishedGoods = async (req, res, next) => {
  try {
    const products = await Product.find({ moderationStatus: { $ne: 'removed' } })
      .select('title images stock lowStockThreshold costPrice priceRange unit category updatedAt sellerId')
      .sort({ stock: 1 });
    const hydrated = await userStore.hydrate(products, ['sellerId']);
    res.json({ products: hydrated });
  } catch (err) {
    next(err);
  }
};
