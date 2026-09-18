'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Loader2, Package, Upload, X, Image as ImageIcon, PlusCircle,
  Search, ChevronLeft, ChevronRight,
} from 'lucide-react';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

const EMPTY_FORM = {
  title: '', description: '', category: [], subCategory: [], unit: 'piece', minOrderQty: 1,
  location: '', tags: '', images: [],
  priceRange: { min: '', max: '' },
  stock: 0, costPrice: 0, lowStockThreshold: 10,
  variants: [],
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dbCategories, setDbCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [descPreview, setDescPreview] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: rowsPerPage };
      if (search) params.search = search;
      const res = await api.get('/products/me/list', { params });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, rowsPerPage]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories').then((r) => {
      setDbCategories(r.data.categories || []);
      setCategoryTree(r.data.tree || []);
    }).catch(() => {});
  }, []);

  // Subcategories available for the currently selected main categories
  const availableSubCategories = categoryTree
    .filter((cat) => form.category.includes(cat.name))
    .flatMap((cat) => cat.children || []);

  const openAdd = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setDescPreview(false);
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setDescPreview(false);
    setEditProduct(product);
    setForm({
      title: product.title || '',
      description: product.description || '',
      category: Array.isArray(product.category) ? product.category : [product.category].filter(Boolean),
      subCategory: Array.isArray(product.subCategory) ? product.subCategory : [product.subCategory].filter(Boolean),
      unit: product.unit || 'piece',
      minOrderQty: product.minOrderQty || 1,
      location: product.location || '',
      tags: (product.tags || []).join(', '),
      images: product.images || [],
      priceRange: { min: product.priceRange?.min || '', max: product.priceRange?.max || '' },
      stock: product.stock ?? 0,
      costPrice: product.costPrice ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 10,
      variants: product.variants || [],
    });
    setDialogOpen(true);
  };

  const MAX_IMAGES = 50;
  const CONCURRENCY = 5;

  const uploadFiles = async (files) => {
    const current = form.images.length;
    const slots = MAX_IMAGES - current;
    if (slots <= 0) { toast.error(`Maximum ${MAX_IMAGES} images already reached`); return; }
    const toUpload = Array.from(files).slice(0, slots);
    if (toUpload.length < files.length) toast(`Only ${slots} slot${slots !== 1 ? 's' : ''} remaining — uploading first ${toUpload.length}`);

    setUploadProgress({ done: 0, total: toUpload.length });

    const uploadOne = async (file) => {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd);
      setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
      return res.data.url;
    };

    // Process in batches of CONCURRENCY
    const results = [];
    for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
      const batch = toUpload.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(batch.map(uploadOne));
      results.push(...batchResults);
    }

    const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (urls.length) setForm((p) => ({ ...p, images: [...p.images, ...urls] }));
    if (urls.length) toast.success(`${urls.length} image${urls.length !== 1 ? 's' : ''} uploaded`);
    if (failed) toast.error(`${failed} image${failed !== 1 ? 's' : ''} failed to upload`);
    setUploadProgress({ done: 0, total: 0 });
  };

  const handleImageInput = (e) => { if (e.target.files?.length) uploadFiles(e.target.files); };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  };

  const addVariant = () => {
    setForm((p) => ({ ...p, variants: [...p.variants, { name: '', options: [], _input: '' }] }));
  };

  const removeVariant = (vi) => {
    setForm((p) => ({ ...p, variants: p.variants.filter((_, i) => i !== vi) }));
  };

  const updateVariantName = (vi, name) => {
    setForm((p) => {
      const variants = [...p.variants];
      variants[vi] = { ...variants[vi], name };
      return { ...p, variants };
    });
  };

  const updateVariantInput = (vi, val) => {
    setForm((p) => {
      const variants = [...p.variants];
      variants[vi] = { ...variants[vi], _input: val };
      return { ...p, variants };
    });
  };

  const addVariantOption = (vi) => {
    setForm((p) => {
      const variants = [...p.variants];
      const val = (variants[vi]._input || '').trim();
      if (!val || variants[vi].options.includes(val)) return p;
      variants[vi] = { ...variants[vi], options: [...variants[vi].options, val], _input: '' };
      return { ...p, variants };
    });
  };

  const removeVariantOption = (vi, opt) => {
    setForm((p) => {
      const variants = [...p.variants];
      variants[vi] = { ...variants[vi], options: variants[vi].options.filter((o) => o !== opt) };
      return { ...p, variants };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category.length || !form.priceRange.min || !form.priceRange.max) {
      toast.error('Title, category, and price range are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        priceRange: { min: Number(form.priceRange.min), max: Number(form.priceRange.max) },
        minOrderQty: Number(form.minOrderQty),
        stock: Number(form.stock) || 0,
        costPrice: Number(form.costPrice) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
        variants: (form.variants || [])
          .filter((v) => v.name.trim() && v.options.length > 0)
          .map(({ name, options }) => ({ name: name.trim(), options })),
      };

      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product added');
      }
      setDialogOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      setDeleteConfirm(null);
      fetchProducts(pagination.page);
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">My Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search + rows per page */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, SKU, brand, category..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-navy-400" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-14 w-14 text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-1">No products yet</h3>
              <p className="text-gray-400 text-sm mb-5">Add your first product to start receiving inquiries</p>
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            width={44}
                            height={44}
                            className="w-11 h-11 rounded-md object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-md bg-gray-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-gray-900 line-clamp-1 max-w-[200px]">
                            {product.title}
                          </p>
                          <p className="text-xs text-gray-400">MOQ: {product.minOrderQty} {product.unit}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(Array.isArray(product.category) ? product.category : [product.category].filter(Boolean)).map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-navy-600">
                      {formatPrice(product.priceRange?.min, product.priceRange?.max)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={product.stock <= (product.lowStockThreshold ?? 10) ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {product.stock ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{product.location || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4 text-navy-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(product._id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
              <button
                onClick={() => fetchProducts(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchProducts(p)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    pagination.page === p ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => fetchProducts(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page === pagination.pages}
                className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Product Title *</Label>
              <Input
                placeholder="e.g. Industrial Water Pump 5HP"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Description * <span className="text-gray-400 font-normal text-xs">(HTML supported)</span></Label>
                <button
                  type="button"
                  onClick={() => setDescPreview((p) => !p)}
                  className="text-xs text-alibaba-600 hover:underline font-medium"
                >
                  {descPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {descPreview ? (
                <div
                  className="min-h-[120px] rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm product-description overflow-auto"
                  dangerouslySetInnerHTML={{ __html: form.description || '<span class="text-gray-400">Nothing to preview yet.</span>' }}
                />
              ) : (
                <Textarea
                  placeholder="Paste HTML or write plain text. Use <h3>, <ul>, <li>, <strong> etc."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={6}
                  className="font-mono text-xs"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Main Category * (select one or more)</Label>
                <MultiSelect
                  placeholder="Select main categories"
                  options={categoryTree.map((cat) => ({ value: cat.name, label: cat.name }))}
                  value={form.category}
                  onChange={(newCats) => setForm((p) => ({
                    ...p,
                    category: newCats,
                    subCategory: p.subCategory.filter((s) =>
                      categoryTree.some((c) => newCats.includes(c.name) && (c.children || []).some((ch) => ch.name === s))
                    ),
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subcategory {availableSubCategories.length > 0 ? '(select one or more)' : ''}</Label>
                <MultiSelect
                  placeholder="Select subcategories"
                  disabled={!form.category.length || availableSubCategories.length === 0}
                  emptyText={!form.category.length ? 'Select a main category first' : 'No subcategories for this category'}
                  options={availableSubCategories.map((sub) => ({ value: sub.name, label: sub.name }))}
                  value={form.subCategory}
                  onChange={(v) => setForm((p) => ({ ...p, subCategory: v }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input
                placeholder="e.g. piece, kg, ton, set"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Min Price (USD) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.priceRange.min}
                  onChange={(e) => setForm((p) => ({ ...p, priceRange: { ...p.priceRange, min: e.target.value } }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Price (USD) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.priceRange.max}
                  onChange={(e) => setForm((p) => ({ ...p, priceRange: { ...p.priceRange, max: e.target.value } }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min. Order Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.minOrderQty}
                  onChange={(e) => setForm((p) => ({ ...p, minOrderQty: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Stock on Hand</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Alert Below</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm((p) => ({ ...p, lowStockThreshold: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Origin / Location</Label>
                <Input
                  placeholder="e.g. Shenzhen, China"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input
                  placeholder="industrial, pump, water"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                />
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Product Variants <span className="text-gray-400 font-normal">(Size, Color, Material…)</span></Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Variant
                </Button>
              </div>
              {form.variants.length === 0 && (
                <p className="text-xs text-gray-400">No variants yet — click "Add Variant" to add sizes, colors, etc.</p>
              )}
              {form.variants.map((variant, vi) => (
                <div key={vi} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Variant name (e.g. Size, Color)"
                      value={variant.name}
                      onChange={(e) => updateVariantName(vi, e.target.value)}
                      className="flex-1 bg-white"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(vi)}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {variant.options.map((opt) => (
                      <span key={opt} className="inline-flex items-center gap-1 bg-alibaba-100 text-alibaba-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {opt}
                        <button type="button" onClick={() => removeVariantOption(vi, opt)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type option and press Enter (e.g. Red, S, M, L)"
                      value={variant._input || ''}
                      className="bg-white"
                      onChange={(e) => updateVariantInput(vi, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariantOption(vi); } }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => addVariantOption(vi)}>Add</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Product Images</Label>
                <span className="text-xs text-gray-400">{form.images.length}/{MAX_IMAGES} uploaded</span>
              </div>

              {/* Thumbnails */}
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                      <Image src={url} alt="" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-semibold bg-navy-600 text-white py-0.5">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              {form.images.length < MAX_IMAGES && (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    dragOver
                      ? 'border-alibaba-500 bg-alibaba-50'
                      : 'border-gray-300 bg-gray-50 hover:border-navy-400 hover:bg-gray-100'
                  }`}
                >
                  {uploadProgress.total > 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 w-full">
                      <Loader2 className="h-6 w-6 animate-spin text-navy-500" />
                      <p className="text-sm font-medium text-navy-600">
                        Uploading {uploadProgress.done} of {uploadProgress.total}…
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-navy-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center px-4">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        Drop images here or <span className="text-navy-600 underline">click to browse</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Select up to {MAX_IMAGES - form.images.length} more image{MAX_IMAGES - form.images.length !== 1 ? 's' : ''} · JPG, PNG, WEBP
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageInput}
                    disabled={uploadProgress.total > 0}
                  />
                </label>
              )}
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
