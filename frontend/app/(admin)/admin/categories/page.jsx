'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { CATEGORY_ICONS } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2, Package, Tag, Pencil, Search, ChevronDown, ChevronRight, FolderPlus, Upload, Image as ImageIcon } from 'lucide-react';

const ICON_OPTIONS = [
  'Package', 'Shirt', 'ShoppingBag', 'Baby', 'Sparkles', 'Dumbbell', 'Swords',
  'HardHat', 'Stethoscope', 'ShieldAlert', 'Briefcase', 'Trophy', 'Bike',
  'Tent', 'Fish', 'CloudRain', 'Layers', 'Dog', 'Gift', 'Moon', 'Watch',
  'Tag', 'Star', 'Heart', 'Zap', 'Globe', 'Box', 'Truck', 'Award',
];

function CategoryRow({ cat, depth = 0, onAdd, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = CATEGORY_ICONS[cat.icon] || Package;
  const hasChildren = cat.children?.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-3 py-2.5 px-4 group hover:bg-gray-50 rounded-lg transition-colors ${depth > 0 ? 'border-l-2 border-gray-100 ml-6' : ''}`}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0 ${!hasChildren ? 'invisible' : ''}`}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Icon / image */}
        {cat.image ? (
          <div className={`relative flex-shrink-0 rounded-lg overflow-hidden ${depth === 0 ? 'w-10 h-10' : 'w-8 h-8'}`}>
            <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className={`flex-shrink-0 rounded-lg flex items-center justify-center ${depth === 0 ? 'w-10 h-10 bg-alibaba-50' : 'w-8 h-8 bg-gray-100'}`}>
            <Icon className={`${depth === 0 ? 'h-5 w-5 text-alibaba-600' : 'h-4 w-4 text-gray-500'}`} />
          </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-gray-900 truncate ${depth === 0 ? 'text-base' : 'text-sm'}`}>{cat.name}</p>
          {hasChildren && (
            <p className="text-xs text-gray-400">{cat.children.length} subcategor{cat.children.length === 1 ? 'y' : 'ies'}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAdd(cat)}
            title="Add subcategory"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-navy-600 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Sub
          </button>
          <button
            onClick={() => onEdit(cat)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-navy-600 hover:bg-navy-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="ml-5">
          {cat.children.map((child) => (
            <CategoryRow
              key={child._id}
              cat={child}
              depth={depth + 1}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [parentTarget, setParentTarget] = useState(null); // category we're adding a child to
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', icon: 'Package', image: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const uploadCategoryImage = async (file) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((p) => ({ ...p, image: res.data.url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setTree(res.data.tree || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = (parent = null) => {
    setForm({ name: '', icon: parent?.icon || 'Package', image: '' });
    setEditTarget(null);
    setParentTarget(parent);
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name, icon: cat.icon || 'Package', image: cat.image || '' });
    setEditTarget(cat);
    setParentTarget(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put(`/categories/${editTarget._id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', { ...form, parentId: parentTarget?._id || null });
        toast.success(parentTarget ? `Subcategory added to ${parentTarget.name}` : 'Category created');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget._id}`);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Flatten tree for search
  function flatAll(nodes, result = []) {
    nodes.forEach((n) => { result.push(n); if (n.children?.length) flatAll(n.children, result); });
    return result;
  }
  const totalCount = flatAll(tree).length;

  // Filter tree by search
  function filterTree(nodes, q) {
    return nodes
      .map((n) => {
        const children = filterTree(n.children || [], q);
        const match = n.name.toLowerCase().includes(q.toLowerCase());
        if (match || children.length) return { ...n, children };
        return null;
      })
      .filter(Boolean);
  }
  const displayTree = search ? filterTree(tree, search) : tree;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">{totalCount} categories total · nested subcategories supported</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Button onClick={() => openAdd(null)}>
            <Plus className="h-4 w-4 mr-2" />Add Category
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : displayTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Tag className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">{search ? 'No categories match' : 'No categories yet'}</p>
            {!search && <Button className="mt-4" onClick={() => openAdd(null)}><Plus className="h-4 w-4 mr-2" />Create first category</Button>}
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {displayTree.map((cat) => (
              <CategoryRow
                key={cat._id}
                cat={cat}
                depth={0}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Edit "${editTarget.name}"`
                : parentTarget
                ? `Add subcategory under "${parentTarget.name}"`
                : 'Add Top-Level Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Polo Shirts"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image (optional — used instead of the icon when set)</Label>
              <div className="flex items-center gap-4">
                {form.image ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                    <Image src={form.image} alt="Category" fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploadingImage ? 'Uploading...' : form.image ? 'Replace Image' : 'Upload Image'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadCategoryImage(file);
                      }}
                    />
                  </label>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, image: '' }))}
                      className="text-xs text-red-500 hover:text-red-600 font-medium text-left"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {ICON_OPTIONS.map((iconName) => {
                  const Icon = CATEGORY_ICONS[iconName] || Package;
                  const sel = form.icon === iconName;
                  return (
                    <button
                      key={iconName}
                      onClick={() => setForm((p) => ({ ...p, icon: iconName }))}
                      title={iconName}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${sel ? 'bg-alibaba-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-alibaba-50 hover:text-alibaba-600'}`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {form.image ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={form.image} alt="Category" fill className="object-cover" sizes="40px" />
                </div>
              ) : (() => { const Icon = CATEGORY_ICONS[form.icon] || Package; return (
                <div className="w-10 h-10 rounded-lg bg-alibaba-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-alibaba-600" />
                </div>
              ); })()}
              <div>
                <p className="text-sm font-semibold text-gray-800">{form.name || 'Category Name'}</p>
                <p className="text-xs text-gray-400">{parentTarget ? `Under: ${parentTarget.name}` : 'Top-level category'}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Category</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Delete <strong>{deleteTarget?.name}</strong>
            {deleteTarget?.children?.length > 0 && (
              <span className="text-red-600"> and all {deleteTarget.children.length} subcategories</span>
            )}? Products in this category will remain but won't appear in filters.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
