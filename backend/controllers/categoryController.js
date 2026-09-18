const Category = require('../models/Category');

// Build a tree from a flat list
function buildTree(docs) {
  const map = {};
  docs.forEach((d) => { map[d._id] = { ...d.toObject(), children: [] }; });
  const roots = [];
  docs.forEach((d) => {
    if (d.parent && map[d.parent]) {
      map[d.parent].children.push(map[d._id]);
    } else {
      roots.push(map[d._id]);
    }
  });
  return roots;
}

// Flat list with depth info (for dropdowns)
function flattenTree(nodes, depth = 0, result = []) {
  nodes.forEach((n) => {
    result.push({ _id: n._id, name: n.name, icon: n.icon, image: n.image, parent: n.parent, depth });
    if (n.children?.length) flattenTree(n.children, depth + 1, result);
  });
  return result;
}

exports.getCategories = async (req, res, next) => {
  try {
    const all = await Category.find().sort({ order: 1, name: 1 });
    const tree = buildTree(all);
    const flat = flattenTree(tree);
    res.json({ categories: flat, tree });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, image, parentId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Category name is required' });

    const parent = parentId || null;
    const exists = await Category.findOne({ name: name.trim(), parent });
    if (exists) return res.status(400).json({ message: 'A category with this name already exists at this level' });

    const maxOrder = await Category.findOne({ parent }).sort({ order: -1 }).select('order');
    const category = await Category.create({
      name: name.trim(),
      icon: icon || 'Package',
      image: image || '',
      parent,
      order: (maxOrder?.order || 0) + 1,
    });
    res.status(201).json({ category, message: 'Category created' });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, icon, image, order } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name: name.trim() }), ...(icon && { icon }), ...(image !== undefined && { image }), ...(order !== undefined && { order }) },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ category, message: 'Category updated' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    // Delete all descendants recursively
    async function deleteWithChildren(id) {
      const children = await Category.find({ parent: id });
      for (const child of children) await deleteWithChildren(child._id);
      await Category.findByIdAndDelete(id);
    }
    await deleteWithChildren(req.params.id);
    res.json({ message: 'Category and its subcategories deleted' });
  } catch (err) {
    next(err);
  }
};
