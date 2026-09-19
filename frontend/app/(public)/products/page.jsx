'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/shared/ProductCard';
import { ProductCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { CATEGORY_ICONS, cn } from '@/lib/utils';
import {
  Search, Filter, X, Package,
  SlidersHorizontal, ArrowUpDown, ImageIcon, Tag, MapPin, Loader2, ChevronDown,
} from 'lucide-react';

const LIMIT = 20;

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'oldest',     label: 'Oldest First' },
];

function ActiveFilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-navy-100 text-navy-700 text-xs px-2.5 py-1 rounded-full font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-navy-900 ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function GridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const initialFilters = {
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    parent:   searchParams.get('parent')   || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('location') || '',
    sortBy:   searchParams.get('sortBy')   || 'newest',
    hasImages:searchParams.get('hasImages')|| '',
    tags:     searchParams.get('tags')     || '',
  };

  const [products, setProducts]           = useState([]);
  const [total, setTotal]                 = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [categoryTree, setCategoryTree]   = useState([]);
  const [openSubMenu, setOpenSubMenu]     = useState(null);
  const [subMenuPos, setSubMenuPos]       = useState({ top: 0, left: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [filtersOpen, setFiltersOpen]     = useState(false);
  const [filters, setFilters]             = useState(initialFilters);
  const [searchInput, setSearchInput]     = useState(initialFilters.search);

  useEffect(() => {
    api.get('/products/categories')
      .then((res) => {
        const map = {};
        (res.data.categories || []).forEach(({ name, count }) => { map[name] = count; });
        setCategoryCounts(map);
      })
      .catch(() => {});
    api.get('/categories')
      .then((res) => setCategoryTree(res.data.tree || []))
      .catch(() => {});
  }, []);

  const buildParams = useCallback((f, page) => {
    const p = { page, limit: LIMIT };
    if (f.search)   p.search   = f.search;
    if (f.category) p.category = f.category;
    if (f.category && f.parent) p.parent = f.parent;
    if (f.minPrice) p.minPrice = f.minPrice;
    if (f.maxPrice) p.maxPrice = f.maxPrice;
    if (f.location) p.location = f.location;
    if (f.sortBy && f.sortBy !== 'newest') p.sortBy = f.sortBy;
    if (f.hasImages) p.hasImages = f.hasImages;
    if (f.tags)     p.tags     = f.tags;
    return p;
  }, []);

  // Reset and load page 1 whenever filters change
  useEffect(() => {
    let cancelled = false;
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setProducts([]);
    setHasMore(true);
    setInitialLoading(true);

    api.get('/products', { params: buildParams(filters, 1) })
      .then((res) => {
        if (cancelled) return;
        const items = res.data.products || [];
        const pagination = res.data.pagination || {};
        setProducts(items);
        setTotal(pagination.total || 0);
        const more = (pagination.page || 1) < (pagination.pages || 1);
        setHasMore(more);
        hasMoreRef.current = more;
        pageRef.current = 2;
      })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setInitialLoading(false); });

    return () => { cancelled = true; };
  }, [filters, buildParams]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await api.get('/products', { params: buildParams(filters, pageRef.current) });
      const items = res.data.products || [];
      const pagination = res.data.pagination || {};
      setProducts((prev) => [...prev, ...items]);
      const more = (pagination.page || 1) < (pagination.pages || 1);
      setHasMore(more);
      hasMoreRef.current = more;
      pageRef.current += 1;
    } catch {
      // silently skip failed page loads
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [filters, buildParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openSubMenu) return;
    const handleDocClick = () => setOpenSubMenu(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [openSubMenu]);

  const buildUrl = (f) => {
    const params = new URLSearchParams();
    if (f.search)   params.set('search',   f.search);
    if (f.category) params.set('category', f.category);
    if (f.category && f.parent) params.set('parent', f.parent);
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.location) params.set('location', f.location);
    if (f.sortBy && f.sortBy !== 'newest') params.set('sortBy', f.sortBy);
    if (f.hasImages) params.set('hasImages', f.hasImages);
    if (f.tags)     params.set('tags',     f.tags);
    const qs = params.toString();
    return `/products${qs ? '?' + qs : ''}`;
  };

  const applyFilter = (key, value) => {
    const updated = { ...filters, [key]: value, ...(key === 'category' ? { parent: '' } : {}) };
    setFilters(updated);
    router.push(buildUrl(updated), { scroll: false });
  };

  const applyMultiple = (updates) => {
    const updated = { ...filters, ...updates };
    setFilters(updated);
    router.push(buildUrl(updated), { scroll: false });
  };

  const clearAll = () => {
    const reset = { search: '', category: '', parent: '', minPrice: '', maxPrice: '', location: '', sortBy: 'newest', hasImages: '', tags: '' };
    setFilters(reset);
    setSearchInput('');
    router.push('/products', { scroll: false });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilter('search', searchInput.trim());
  };

  const activeFilterCount = [
    filters.category,
    filters.minPrice || filters.maxPrice,
    filters.location,
    filters.hasImages,
    filters.tags,
    filters.sortBy !== 'newest' ? filters.sortBy : '',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-white mb-1">Product Catalog</h1>
          <p className="text-navy-300 text-sm mb-5">
            {!initialLoading && `${total.toLocaleString()} products from verified suppliers`}
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, brands, categories..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-11 bg-white/95 border-0 placeholder:text-gray-400 text-gray-900"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); applyFilter('search', ''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" variant="gold" className="h-11 px-6">Search</Button>
          </form>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 min-w-max">
            {/* All Products */}
            <button
              onClick={(e) => { e.stopPropagation(); applyFilter('category', ''); setOpenSubMenu(null); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                !filters.category ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All Products
              {!filters.category && total > 0 && <span className="text-xs opacity-75">({total})</span>}
            </button>

            {/* Dynamic category tree pills */}
            {categoryTree.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS[cat.name] || Package;
              const hasChildren = cat.children?.length > 0;
              const isActive = filters.category === cat.name || (filters.parent ? filters.parent === cat.name : cat.children?.some((c) => c.name === filters.category));
              const isOpen = openSubMenu === cat._id;

              return (
                <div key={cat._id} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasChildren) {
                        if (isOpen) {
                          setOpenSubMenu(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setSubMenuPos({ top: rect.bottom + 4, left: rect.left });
                          setOpenSubMenu(cat._id);
                        }
                      } else {
                        applyFilter('category', isActive ? '' : cat.name);
                        setOpenSubMenu(null);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      isActive ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                    {cat.name}
                    {categoryCounts[cat.name] > 0 && (
                      <span className={cn('text-xs', isActive ? 'opacity-75' : 'text-gray-400')}>
                        ({categoryCounts[cat.name]})
                      </span>
                    )}
                    {hasChildren && <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />}
                  </button>

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subcategory dropdown — rendered outside overflow container to avoid clipping */}
      {openSubMenu && (() => {
        const openCat = categoryTree.find((c) => c._id === openSubMenu);
        if (!openCat) return null;
        return (
          <div
            className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] min-w-[200px] py-1"
            style={{ top: subMenuPos.top, left: subMenuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { applyFilter('category', openCat.name); setOpenSubMenu(null); }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm font-semibold transition-colors',
                filters.category === openCat.name ? 'text-navy-600 bg-navy-50' : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              All in {openCat.name}
            </button>
            <div className="border-t border-gray-100 my-1" />
            {openCat.children.map((sub) => {
              const SubIcon = CATEGORY_ICONS[sub.icon] || CATEGORY_ICONS[sub.name] || Package;
              const subActive = filters.category === sub.name && filters.parent === openCat.name;
              return (
                <button
                  key={sub._id}
                  onClick={() => { applyMultiple(subActive ? { category: '', parent: '' } : { category: sub.name, parent: openCat.name }); setOpenSubMenu(null); }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors',
                    subActive ? 'text-navy-600 bg-navy-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  {sub.name}
                </button>
              );
            })}
          </div>
        );
      })()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Filter Sidebar */}
          <aside className={cn('lg:w-56 flex-shrink-0', filtersOpen ? 'block' : 'hidden lg:block')}>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 sticky top-20">
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-navy-600" />
                  <span className="font-semibold text-navy-600 text-sm">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-navy-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear all</button>
                )}
              </div>

              <div className="px-4 py-3">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">
                  <ArrowUpDown className="inline h-3 w-3 mr-1" />Sort By
                </Label>
                <Select value={filters.sortBy} onValueChange={(v) => applyFilter('sortBy', v)}>
                  <SelectTrigger className="w-full h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="px-4 py-3">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">Price Range (USD)</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={filters.minPrice}
                    onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
                    onBlur={() => applyFilter('minPrice', filters.minPrice)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter('minPrice', filters.minPrice)}
                    className="h-9 text-sm" min="0" />
                  <Input type="number" placeholder="Max" value={filters.maxPrice}
                    onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
                    onBlur={() => applyFilter('maxPrice', filters.maxPrice)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter('maxPrice', filters.maxPrice)}
                    className="h-9 text-sm" min="0" />
                </div>
              </div>

              <div className="px-4 py-3">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">
                  <MapPin className="inline h-3 w-3 mr-1" />Origin / Location
                </Label>
                <Input placeholder="e.g. China, Pakistan..." value={filters.location}
                  onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                  onBlur={() => applyFilter('location', filters.location)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilter('location', filters.location)}
                  className="h-9 text-sm" />
              </div>

              <div className="px-4 py-3">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">
                  <Tag className="inline h-3 w-3 mr-1" />Tags / Keywords
                </Label>
                <Input placeholder="pump, organic, ISO..." value={filters.tags}
                  onChange={(e) => setFilters((p) => ({ ...p, tags: e.target.value }))}
                  onBlur={() => applyFilter('tags', filters.tags)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilter('tags', filters.tags)}
                  className="h-9 text-sm" />
              </div>

              <div className="px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer"
                  onClick={() => applyFilter('hasImages', filters.hasImages ? '' : 'true')}>
                  <div className={cn('relative w-10 h-5 rounded-full transition-colors flex-shrink-0', filters.hasImages ? 'bg-navy-600' : 'bg-gray-300')}>
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      filters.hasImages ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-gray-400" />With photos only
                  </span>
                </label>
              </div>

              <div className="px-4 py-3 lg:hidden">
                <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                  Show Results ({total})
                </Button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center gap-1.5 text-sm font-medium text-navy-600 bg-white border border-gray-200 px-3 py-2 rounded-lg"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-navy-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
                  )}
                </button>
                {!initialLoading && (
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{total.toLocaleString()}</span>{' '}
                    {filters.search ? `results for "${filters.search}"` : 'products found'}
                  </p>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-400">Sort:</span>
                <Select value={filters.sortBy} onValueChange={(v) => applyFilter('sortBy', v)}>
                  <SelectTrigger className="h-8 text-xs w-40 border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter chips */}
            {(filters.search || filters.category || filters.minPrice || filters.maxPrice ||
              filters.location || filters.hasImages || filters.tags || filters.sortBy !== 'newest') && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.search && (
                  <ActiveFilterChip label={`"${filters.search}"`} onRemove={() => { setSearchInput(''); applyFilter('search', ''); }} />
                )}
                {filters.category && (() => {
                  const CatIcon = CATEGORY_ICONS[filters.category] || Package;
                  return (
                    <ActiveFilterChip
                      label={<span className="inline-flex items-center gap-1"><CatIcon className="h-3 w-3" />{filters.category}</span>}
                      onRemove={() => applyFilter('category', '')}
                    />
                  );
                })()}
                {(filters.minPrice || filters.maxPrice) && (
                  <ActiveFilterChip
                    label={`$${filters.minPrice || '0'} – $${filters.maxPrice || '∞'}`}
                    onRemove={() => applyMultiple({ minPrice: '', maxPrice: '' })}
                  />
                )}
                {filters.location && (
                  <ActiveFilterChip label={<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{filters.location}</span>} onRemove={() => applyFilter('location', '')} />
                )}
                {filters.tags && (
                  <ActiveFilterChip label={<span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" />{filters.tags}</span>} onRemove={() => applyFilter('tags', '')} />
                )}
                {filters.hasImages && (
                  <ActiveFilterChip label={<span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" />With photos</span>} onRemove={() => applyFilter('hasImages', '')} />
                )}
                {filters.sortBy !== 'newest' && (
                  <ActiveFilterChip
                    label={SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label || filters.sortBy}
                    onRemove={() => applyFilter('sortBy', 'newest')}
                  />
                )}
                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {/* Grid */}
            {initialLoading ? (
              <GridSkeleton count={10} />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-gray-200">
                <Package className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-5 max-w-xs">
                  {filters.search
                    ? `No results for "${filters.search}". Try different keywords or remove filters.`
                    : 'Try removing some filters to see more results.'}
                </p>
                <Button variant="outline" onClick={clearAll}>Clear All Filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {hasMore ? (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {loadingMore ? 'Loading…' : 'View More'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400 mt-6">All products loaded</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="bg-navy-600 h-40" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <GridSkeleton count={10} />
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
