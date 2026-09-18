const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    images: [{ type: String }],
    tags: [{ type: String }],
    published: { type: Boolean, default: false },
    authorName: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

blogSchema.index({ slug: 1 });
blogSchema.index({ published: 1, createdAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);
