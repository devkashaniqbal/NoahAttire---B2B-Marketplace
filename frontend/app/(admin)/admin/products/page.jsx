'use client';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { formatPrice, formatDate, CATEGORY_ICONS, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, Package, Trash2, Loader2, ExternalLink, CheckCircle2,
  Flag, ShieldOff, Plus, Check, PencilLine, ChevronLeft, ChevronRight,
} from 'lucide-react';

const EMPTY_FORM = {
  sellerId: '', title: '', sku: '', brand: '', description: '', category: [], subCategory: [], unit: 'piece', minOrderQty: 1,
  location: '', tags: '', priceRange: { min: '', max: '' },
  stock: 0, costPrice: 0, lowStockThreshold: 10,
};

const TABS = [
  { value: 'all',     label: 'All Products' },
  { value: 'active',  label: 'Active' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'removed', label: 'Removed / Inactive' },
];

const MOD_CONFIG = {
  active:  { label: 'Active',   bg: 'bg-green-100 text-green-700' },
  flagged: { label: 'Flagged',  bg: 'bg-amber-100 text-amber-700' },
  removed: { label: 'Inactive', bg: 'bg-red-100 text-red-700' },
};

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

const EMPTY_BULK = {
  category:          { enabled: false, value: [] },
  subCategory:        { enabled: false, value: [] },
  brand:              { enabled: false, value: '' },
  price:              { enabled: false, min: '', max: '' },
  stock:              { enabled: false, value: '' },
  minOrderQty:        { enabled: false, value: '' },
  tags:               { enabled: false, value: '' },
  unit:               { enabled: false, value: '' },
  location:           { enabled: false, value: '' },
  costPrice:          { enabled: false, value: '' },
  lowStockThreshold:  { enabled: false, value: '' },
};

function Checkbox({ checked, indeterminate, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-4.5 w-4.5 items-center justify-center rounded border transition-colors flex-shrink-0',
        checked || indeterminate ? 'bg-navy-600 border-navy-600' : 'bg-white border-gray-300 hover:border-navy-400',
        className
      )}
    >
      {checked && <Check className="h-3 w-3 text-white" />}
      {!checked && indeterminate && <span className="h-0.5 w-2 bg-white rounded-full" />}
    </button>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 25 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dbCategories, setDbCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [actionId, setActionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Bulk selection & editing
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectingAll, setSelectingAll] = useState(false);
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkStatusBusy, setBulkStatusBusy] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState(EMPTY_BULK);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Debounce free-text search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filterParams = useMemo(() => {
    const params = {};
    if (search) params.search = search;
    if (category !== 'all') params.category = category;
    if (subCategoryFilter !== 'all') params.subCategory = subCategoryFilter;
    if (brandFilter) params.brand = brandFilter;
    if (activeTab !== 'all') params.moderationStatus = activeTab;
    return params;
  }, [search, category, subCategoryFilter, brandFilter, activeTab]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products', { params: { ...filterParams, page, limit: rowsPerPage } });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: rowsPerPage });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filterParams, rowsPerPage]);

  useEffect(() => {
    fetchProducts(1);
    setSelectedIds(new Set());
    setAllMatchingSelected(false);
  }, [filterParams, rowsPerPage, fetchProducts]);

  useEffect(() => {
    api.get('/categories').then((r) => {
      setDbCategories(r.data.categories || []);
      setCategoryTree(r.data.tree || []);
    }).catch(() => {});
  }, []);

  // Subcategories available for the currently selected main categories (Add Product form)
  const availableSubCategories = categoryTree
    .filter((cat) => form.category.includes(cat.name))
    .flatMap((cat) => cat.children || []);

  // Subcategories available for bulk-edit's chosen categories
  const bulkAvailableSubCategories = categoryTree
    .filter((cat) => bulkForm.category.value.includes(cat.name))
    .flatMap((cat) => cat.children || []);

  // Subcategory filter dropdown options (based on category filter, or all if "all")
  const filterSubCategoryOptions = category === 'all'
    ? categoryTree.flatMap((cat) => cat.children || [])
    : (categoryTree.find((cat) => cat.name === category)?.children || []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/admin/products?tab=${tab}`, { scroll: false });
  };

  const moderate = async (productId, status) => {
    setActionId(productId);
    try {
      await api.patch(`/admin/products/${productId}/moderate`, { status });
      toast.success(`Product ${status}`);
      fetchProducts(pagination.page);
    } catch {
      toast.error('Action failed');
    } finally {
      setActionId(null);
    }
  };

  const openAdd = async () => {
    setForm(EMPTY_FORM);
    setShowAdd(true);
    try {
      const res = await api.get('/admin/sellers', { params: { limit: 200 } });
      setSellers(res.data.sellers || []);
    } catch {
      setSellers([]);
    }
  };

  const handleAddProduct = async () => {
    if (!form.sellerId || !form.title || !form.category.length || !form.priceRange.min || !form.priceRange.max) {
      toast.error('Seller, title, category, and price range are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/products', {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        priceRange: { min: Number(form.priceRange.min), max: Number(form.priceRange.max) },
        minOrderQty: Number(form.minOrderQty),
        stock: Number(form.stock) || 0,
        costPrice: Number(form.costPrice) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
      });
      toast.success('Product added');
      setShowAdd(false);
      fetchProducts(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${deleteTarget}`);
      toast.success('Product permanently deleted');
      setDeleteTarget(null);
      fetchProducts(pagination.page);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Selection helpers ───
  const pageIds = products.map((p) => p._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setAllMatchingSelected(false);
  };

  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
    setAllMatchingSelected(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setAllMatchingSelected(false);
  };

  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const res = await api.get('/admin/products/ids', { params: filterParams });
      setSelectedIds(new Set(res.data.ids));
      setAllMatchingSelected(true);
      toast.success(`${res.data.total} product(s) selected`);
    } catch {
      toast.error('Failed to select all matching products');
    } finally {
      setSelectingAll(false);
    }
  };

  // ─── Bulk actions ───
  const bulkModerate = async (status) => {
    if (!selectedIds.size) return;
    setBulkStatusBusy(true);
    try {
      const res = await api.patch('/admin/products/bulk/moderate', { ids: [...selectedIds], status });
      toast.success(res.data.message || 'Products updated');
      clearSelection();
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk action failed');
    } finally {
      setBulkStatusBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    setBulkDeleting(true);
    try {
      const res = await api.delete('/admin/products/bulk', { data: { ids: [...selectedIds] } });
      toast.success(res.data.message || 'Products deleted');
      setBulkDeleteOpen(false);
      clearSelection();
      fetchProducts(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const openBulkEdit = () => {
    setBulkForm(EMPTY_BULK);
    setBulkEditOpen(true);
  };

  const handleBulkEditSubmit = async () => {
    const updates = {};
    const f = bulkForm;
    if (f.category.enabled) {
      if (!f.category.value.length) { toast.error('Select at least one category'); return; }
      updates.category = f.category.value;
    }
    if (f.subCategory.enabled) updates.subCategory = f.subCategory.value;
    if (f.brand.enabled) updates.brand = f.brand.value.trim();
    if (f.price.enabled) {
      if (!f.price.min || !f.price.max) { toast.error('Enter both min and max price'); return; }
      updates.priceRange = { min: Number(f.price.min), max: Number(f.price.max) };
    }
    if (f.stock.enabled) updates.stock = Number(f.stock.value) || 0;
    if (f.minOrderQty.enabled) updates.minOrderQty = Number(f.minOrderQty.value) || 1;
    if (f.tags.enabled) updates.tags = f.tags.value.split(',').map((t) => t.trim()).filter(Boolean);
    if (f.unit.enabled) updates.unit = f.unit.value.trim();
    if (f.location.enabled) updates.location = f.location.value.trim();
    if (f.costPrice.enabled) updates.costPrice = Number(f.costPrice.value) || 0;
    if (f.lowStockThreshold.enabled) updates.lowStockThreshold = Number(f.lowStockThreshold.value) || 0;

    if (!Object.keys(updates).length) {
      toast.error('Enable at least one field to update');
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await api.patch('/admin/products/bulk', { ids: [...selectedIds], updates });
      toast.success(res.data.message || 'Products updated');
      setBulkEditOpen(false);
      clearSelection();
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk edit failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const setBulkField = (key, patch) => setBulkForm((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Moderation</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} products in this view</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search name, SKU, brand, category, supplier..." value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 w-72" />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setSubCategoryFilter('all'); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {dbCategories.filter((c) => !c.depth).map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Subcategory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subcategories</SelectItem>
            {filterSubCategoryOptions.map((sub) => (
              <SelectItem key={sub._id} value={sub.name}>{sub.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Filter by brand..." value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)} className="w-40" />
        <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-4">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => handleTabChange(tab.value)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.value ? 'bg-white shadow-sm text-navy-600' : 'text-gray-500 hover:text-gray-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-navy-50 border border-navy-100 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm font-semibold text-navy-700">
            {selectedIds.size} selected
          </span>
          {!allMatchingSelected && allPageSelected && pagination.total > pageIds.length && (
            <button onClick={selectAllMatching} disabled={selectingAll}
              className="text-xs font-semibold text-alibaba-600 hover:underline disabled:opacity-50 flex items-center gap-1">
              {selectingAll && <Loader2 className="h-3 w-3 animate-spin" />}
              Select all {pagination.total} matching products
            </button>
          )}
          <button onClick={clearSelection} className="text-xs font-medium text-gray-500 hover:text-gray-700">
            Clear selection
          </button>
          <div className="flex-1" />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={openBulkEdit} className="h-8 text-xs">
              <PencilLine className="h-3.5 w-3.5 mr-1" /> Bulk Edit
            </Button>
            <Button size="sm" variant="outline" disabled={bulkStatusBusy} onClick={() => bulkModerate('active')}
              className="h-8 text-xs border-green-200 text-green-600 hover:bg-green-50">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activate
            </Button>
            <Button size="sm" variant="outline" disabled={bulkStatusBusy} onClick={() => bulkModerate('removed')}
              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50">
              <ShieldOff className="h-3.5 w-3.5 mr-1" /> Deactivate
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkDeleteOpen(true)}
              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400 text-sm">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 w-10">
                    <Checkbox checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} onClick={toggleAllOnPage} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand / Seller</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listed</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const mod = product.moderationStatus || 'active';
                  const modCfg = MOD_CONFIG[mod] || MOD_CONFIG.active;
                  const isBusy = actionId === product._id;
                  const isSelected = selectedIds.has(product._id);

                  return (
                    <tr key={product._id} className={cn('hover:bg-gray-50 transition-colors', isSelected && 'bg-navy-50/50')}>
                      <td className="px-4 py-3.5">
                        <Checkbox checked={isSelected} onClick={() => toggleRow(product._id)} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.title} width={40} height={40}
                              className="w-10 h-10 rounded-md object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {(() => { const I = CATEGORY_ICONS[product.category?.[0]] || Package; return <I className="h-5 w-5 text-gray-400" />; })()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 max-w-[200px] truncate">{product.title}</p>
                            {product.sku && <p className="text-xs text-gray-400 truncate">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-800 font-medium">{product.brandName || product.sellerId?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{product.sellerId?.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {(() => { const cats = Array.isArray(product.category) ? product.category : [product.category].filter(Boolean); const I = CATEGORY_ICONS[cats[0]]; return (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-sm text-gray-600">
                              {I && <I className="h-3.5 w-3.5 text-gray-400" />}
                              {cats.join(', ') || '—'}
                            </span>
                            {product.subCategory?.length > 0 && (
                              <span className="text-xs text-gray-400">{product.subCategory.join(', ')}</span>
                            )}
                          </div>
                        ); })()}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-navy-600">
                        {formatPrice(product.priceRange?.min, product.priceRange?.max)}
                        {product.unit && <span className="text-gray-400 font-normal text-xs ml-1">/{product.unit}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={product.stock <= (product.lowStockThreshold ?? 10) ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                          {product.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', modCfg.bg)}>
                          {modCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(product.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                            <Link href={`/products/${product._id}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>

                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {mod !== 'active' && (
                                <Button variant="outline" size="sm" onClick={() => moderate(product._id, 'active')}
                                  className="h-7 text-xs border-green-200 text-green-600 hover:bg-green-50 px-2">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                                </Button>
                              )}
                              {mod !== 'flagged' && (
                                <Button variant="outline" size="sm" onClick={() => moderate(product._id, 'flagged')}
                                  className="h-7 text-xs border-amber-200 text-amber-600 hover:bg-amber-50 px-2">
                                  <Flag className="h-3 w-3 mr-1" />Flag
                                </Button>
                              )}
                              {mod !== 'removed' && (
                                <Button variant="outline" size="sm" onClick={() => moderate(product._id, 'removed')}
                                  className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 px-2">
                                  <ShieldOff className="h-3 w-3 mr-1" />Remove
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(product._id)}
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
            <button onClick={() => fetchProducts(Math.max(1, pagination.page - 1))} disabled={pagination.page === 1}
              className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => fetchProducts(p)}
                className={cn('w-8 h-8 rounded text-sm font-medium transition-colors',
                  pagination.page === p ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {p}
              </button>
            ))}
            <button onClick={() => fetchProducts(Math.min(pagination.pages, pagination.page + 1))} disabled={pagination.page === pagination.pages}
              className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Product Permanently</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            This will permanently delete the product and all its data. Consider using "Remove" instead to hide it while keeping records.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirm dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete {selectedIds.size} Products Permanently</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            This will permanently delete all {selectedIds.size} selected products and their data. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete {selectedIds.size} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk edit dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedIds.size} Products</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">
            Enable only the fields you want to overwrite — untouched fields stay as they are on each product.
          </p>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">

            {/* Category / Subcategory */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('category', { enabled: !bulkForm.category.enabled })}>
                  <Checkbox checked={bulkForm.category.enabled} />
                  <Label className="cursor-pointer">Main Category</Label>
                </div>
                <MultiSelect
                  placeholder="Select main categories"
                  disabled={!bulkForm.category.enabled}
                  options={categoryTree.map((cat) => ({ value: cat.name, label: cat.name }))}
                  value={bulkForm.category.value}
                  onChange={(v) => setBulkField('category', { value: v })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('subCategory', { enabled: !bulkForm.subCategory.enabled })}>
                  <Checkbox checked={bulkForm.subCategory.enabled} />
                  <Label className="cursor-pointer">Subcategory</Label>
                </div>
                <MultiSelect
                  placeholder="Select subcategories"
                  disabled={!bulkForm.subCategory.enabled || bulkAvailableSubCategories.length === 0}
                  emptyText={!bulkForm.category.value.length ? 'Select a main category first' : 'No subcategories available'}
                  options={bulkAvailableSubCategories.map((sub) => ({ value: sub.name, label: sub.name }))}
                  value={bulkForm.subCategory.value}
                  onChange={(v) => setBulkField('subCategory', { value: v })}
                />
              </div>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('brand', { enabled: !bulkForm.brand.enabled })}>
                <Checkbox checked={bulkForm.brand.enabled} />
                <Label className="cursor-pointer">Brand</Label>
              </div>
              <Input placeholder="e.g. Noah Attire" value={bulkForm.brand.value} disabled={!bulkForm.brand.enabled}
                onChange={(e) => setBulkField('brand', { value: e.target.value })} />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('price', { enabled: !bulkForm.price.enabled })}>
                <Checkbox checked={bulkForm.price.enabled} />
                <Label className="cursor-pointer">Price Range (USD)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" min="0" placeholder="Min" value={bulkForm.price.min} disabled={!bulkForm.price.enabled}
                  onChange={(e) => setBulkField('price', { min: e.target.value })} />
                <Input type="number" min="0" placeholder="Max" value={bulkForm.price.max} disabled={!bulkForm.price.enabled}
                  onChange={(e) => setBulkField('price', { max: e.target.value })} />
              </div>
            </div>

            {/* Stock / MOQ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('stock', { enabled: !bulkForm.stock.enabled })}>
                  <Checkbox checked={bulkForm.stock.enabled} />
                  <Label className="cursor-pointer">Stock Quantity</Label>
                </div>
                <Input type="number" min="0" value={bulkForm.stock.value} disabled={!bulkForm.stock.enabled}
                  onChange={(e) => setBulkField('stock', { value: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('minOrderQty', { enabled: !bulkForm.minOrderQty.enabled })}>
                  <Checkbox checked={bulkForm.minOrderQty.enabled} />
                  <Label className="cursor-pointer">Min. Order Qty</Label>
                </div>
                <Input type="number" min="1" value={bulkForm.minOrderQty.value} disabled={!bulkForm.minOrderQty.enabled}
                  onChange={(e) => setBulkField('minOrderQty', { value: e.target.value })} />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('tags', { enabled: !bulkForm.tags.enabled })}>
                <Checkbox checked={bulkForm.tags.enabled} />
                <Label className="cursor-pointer">Tags (comma-separated, replaces existing tags)</Label>
              </div>
              <Input placeholder="industrial, pump, water" value={bulkForm.tags.value} disabled={!bulkForm.tags.enabled}
                onChange={(e) => setBulkField('tags', { value: e.target.value })} />
            </div>

            {/* Unit / Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('unit', { enabled: !bulkForm.unit.enabled })}>
                  <Checkbox checked={bulkForm.unit.enabled} />
                  <Label className="cursor-pointer">Unit</Label>
                </div>
                <Input placeholder="e.g. piece, kg, ton" value={bulkForm.unit.value} disabled={!bulkForm.unit.enabled}
                  onChange={(e) => setBulkField('unit', { value: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('location', { enabled: !bulkForm.location.enabled })}>
                  <Checkbox checked={bulkForm.location.enabled} />
                  <Label className="cursor-pointer">Origin / Location</Label>
                </div>
                <Input placeholder="e.g. Sialkot, Pakistan" value={bulkForm.location.value} disabled={!bulkForm.location.enabled}
                  onChange={(e) => setBulkField('location', { value: e.target.value })} />
              </div>
            </div>

            {/* Cost price / low stock threshold */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('costPrice', { enabled: !bulkForm.costPrice.enabled })}>
                  <Checkbox checked={bulkForm.costPrice.enabled} />
                  <Label className="cursor-pointer">Cost Price (USD)</Label>
                </div>
                <Input type="number" min="0" value={bulkForm.costPrice.value} disabled={!bulkForm.costPrice.enabled}
                  onChange={(e) => setBulkField('costPrice', { value: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setBulkField('lowStockThreshold', { enabled: !bulkForm.lowStockThreshold.enabled })}>
                  <Checkbox checked={bulkForm.lowStockThreshold.enabled} />
                  <Label className="cursor-pointer">Low Stock Alert Below</Label>
                </div>
                <Input type="number" min="0" value={bulkForm.lowStockThreshold.value} disabled={!bulkForm.lowStockThreshold.enabled}
                  onChange={(e) => setBulkField('lowStockThreshold', { value: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkEditSubmit} disabled={bulkSubmitting}>
              {bulkSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update {selectedIds.size} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add product dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Product (as Admin)</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Seller *</Label>
              <Select value={form.sellerId} onValueChange={(v) => setForm((p) => ({ ...p, sellerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select seller" /></SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.userId?._id} value={s.userId?._id}>
                      {s.userId?.name} ({s.userId?.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Product Title *</Label>
                <Input placeholder="e.g. Industrial Water Pump 5HP" value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input placeholder="e.g. WP-5HP-001" value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Detailed product description..." rows={3} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Brand <span className="text-gray-400 font-normal text-xs">(overrides seller's store name)</span></Label>
                <Input placeholder="e.g. Noah Attire" value={form.brand}
                  onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input placeholder="e.g. piece, kg, ton" value={form.unit}
                  onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Min Price (USD) *</Label>
                <Input type="number" min="0" value={form.priceRange.min}
                  onChange={(e) => setForm((p) => ({ ...p, priceRange: { ...p.priceRange, min: e.target.value } }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Price (USD) *</Label>
                <Input type="number" min="0" value={form.priceRange.max}
                  onChange={(e) => setForm((p) => ({ ...p, priceRange: { ...p.priceRange, max: e.target.value } }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Min. Order Qty</Label>
                <Input type="number" min="1" value={form.minOrderQty}
                  onChange={(e) => setForm((p) => ({ ...p, minOrderQty: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Stock on Hand</Label>
                <Input type="number" min="0" value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (USD)</Label>
                <Input type="number" min="0" value={form.costPrice}
                  onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Alert Below</Label>
                <Input type="number" min="0" value={form.lowStockThreshold}
                  onChange={(e) => setForm((p) => ({ ...p, lowStockThreshold: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Origin / Location</Label>
                <Input placeholder="e.g. Shenzhen, China" value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input placeholder="industrial, pump, water" value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
