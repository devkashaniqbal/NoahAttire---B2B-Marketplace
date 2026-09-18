'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Loader2, Upload, X, BookOpen, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const EMPTY_FORM = {
  title: '', content: '', coverImage: '', tags: '', authorName: 'Admin', published: false,
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBlog, setEditBlog] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/blogs', { params: { limit: 50 } });
      setBlogs(res.data.blogs || []);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const openAdd = () => {
    setEditBlog(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (blog) => {
    setEditBlog(blog);
    setForm({
      title: blog.title || '',
      content: blog.content || '',
      coverImage: blog.coverImage || '',
      tags: (blog.tags || []).join(', '),
      authorName: blog.authorName || 'Admin',
      published: blog.published ?? false,
    });
    setDialogOpen(true);
  };

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((p) => ({ ...p, coverImage: res.data.url }));
      toast.success('Cover image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editBlog) {
        await api.put(`/blogs/${editBlog._id}`, payload);
        toast.success('Blog post updated');
      } else {
        await api.post('/blogs', payload);
        toast.success('Blog post created');
      }
      setDialogOpen(false);
      fetchBlogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save blog post');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (blog) => {
    try {
      await api.put(`/blogs/${blog._id}`, { published: !blog.published });
      toast.success(blog.published ? 'Post unpublished' : 'Post published');
      fetchBlogs();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Blog post deleted');
      setDeleteConfirm(null);
      fetchBlogs();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Blog Posts</h1>
          <p className="text-gray-500 text-sm mt-1">{blogs.length} post{blogs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No blog posts yet</h3>
          <p className="text-gray-400 text-sm mb-5">Write your first post to share news, updates, and insights</p>
          <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Write First Post</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {blogs.map((blog) => (
            <Card key={blog._id} className="overflow-hidden flex flex-col">
              <div className="relative h-44 bg-gray-100 flex-shrink-0">
                {blog.coverImage ? (
                  <Image src={blog.coverImage} alt={blog.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={blog.published ? 'default' : 'secondary'} className="text-xs">
                    {blog.published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{blog.title}</h3>
                <p className="text-xs text-gray-400 mb-3">By {blog.authorName}</p>
                {blog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(blog)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => togglePublish(blog)}>
                    {blog.published
                      ? <><EyeOff className="h-3.5 w-3.5 mr-1" /> Unpublish</>
                      : <><Eye className="h-3.5 w-3.5 mr-1" /> Publish</>}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(blog._id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editBlog ? 'Edit Blog Post' : 'New Blog Post'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Post title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-1.5">
              <Label>Cover Image</Label>
              {form.coverImage ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={form.coverImage} alt="Cover" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, coverImage: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-alibaba-400 transition-colors">
                  {uploadingCover ? (
                    <Loader2 className="h-6 w-6 animate-spin text-alibaba-500" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload cover image</span>
                      <span className="text-xs text-gray-400 mt-1">Recommended: 1200×630px</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadCover} disabled={uploadingCover} />
                </label>
              )}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea
                placeholder="Write your blog post content here...

You can use blank lines to separate paragraphs."
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={14}
                className="font-mono text-sm leading-relaxed resize-y"
                required
              />
              <p className="text-xs text-gray-400">Use blank lines to separate paragraphs. Content displays exactly as written.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Author Name</Label>
                <Input
                  placeholder="Admin"
                  value={form.authorName}
                  onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input
                  placeholder="news, update, products"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                className="h-4 w-4 accent-alibaba-600"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700 cursor-pointer">
                Publish immediately (visible to all visitors)
              </label>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editBlog ? 'Update Post' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Blog Post</DialogTitle></DialogHeader>
          <p className="text-gray-600 text-sm">This will permanently delete the post. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
