const Blog = require('../models/Blog');

const toSlug = (title) =>
  title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const uniqueSlug = async (base) => {
  let slug = base;
  let n = 1;
  while (await Blog.exists({ slug })) {
    slug = `${base}-${n++}`;
  }
  return slug;
};

exports.getBlogs = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { published: true };
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-content'),
      Blog.countDocuments(filter),
    ]);

    res.json({ blogs, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getBlogBySlug = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? { slug: req.params.slug } : { slug: req.params.slug, published: true };
    const blog = await Blog.findOne(filter);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });
    res.json({ blog });
  } catch (err) { next(err); }
};

exports.createBlog = async (req, res, next) => {
  try {
    const { title, content, coverImage, images, tags, published, authorName } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const slug = await uniqueSlug(toSlug(title));
    const blog = await Blog.create({
      title: title.trim(),
      slug,
      content: content.trim(),
      coverImage: coverImage || '',
      images: images || [],
      tags: tags || [],
      published: published ?? false,
      authorName: authorName || 'Admin',
    });
    res.status(201).json({ blog, message: 'Blog post created' });
  } catch (err) { next(err); }
};

exports.updateBlog = async (req, res, next) => {
  try {
    const { title, content, coverImage, images, tags, published, authorName } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });

    if (title && title.trim() !== blog.title) {
      blog.slug = await uniqueSlug(toSlug(title.trim()));
      blog.title = title.trim();
    }
    if (content !== undefined) blog.content = content.trim();
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (images !== undefined) blog.images = images;
    if (tags !== undefined) blog.tags = tags;
    if (published !== undefined) blog.published = published;
    if (authorName !== undefined) blog.authorName = authorName;

    await blog.save();
    res.json({ blog, message: 'Blog post updated' });
  } catch (err) { next(err); }
};

exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });
    res.json({ message: 'Blog post deleted' });
  } catch (err) { next(err); }
};
