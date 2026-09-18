'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DealProductCard from '@/components/shared/DealProductCard';
import BestSellingCard from '@/components/shared/BestSellingCard';
import CountdownTimer from '@/components/shared/CountdownTimer';
import TrustBadges from '@/components/shared/TrustBadges';
import { ProductCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { CATEGORY_ICONS } from '@/lib/utils';
import { ArrowRight, Package, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_HERO_BANNERS = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=1200&q=80',
];

function Hero({ settings }) {
  const headline = settings?.heroHeadline || 'SOURCE THE LATEST PRODUCTS ONLINE';
  const subtext = settings?.heroSubtext || 'Explore top quality products at the best prices from verified B2B suppliers.';
  const buttonText = settings?.heroButtonText || 'SHOP NOW';
  const buttonLink = settings?.heroButtonLink || '/products';
  const banners = settings?.heroBanners?.length ? settings.heroBanners : (settings?.heroImage ? [settings.heroImage] : DEFAULT_HERO_BANNERS);

  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="relative overflow-hidden h-[320px] md:h-[460px]">
      {banners.map((src, i) => (
        <Image
          key={src + i}
          src={src}
          alt="Global trade and supply chain"
          fill
          className={`object-cover transition-opacity duration-700 ${i === slide ? 'opacity-100' : 'opacity-0'}`}
          priority={i === 0}
          sizes="100vw"
        />
      ))}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-center">
        <span className="inline-block bg-amber-400 text-gray-900 text-xs font-bold tracking-wide px-3 py-1 rounded-full mb-4">
          VERIFIED SUPPLIERS
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-md max-w-xl">
          {headline}
        </h1>
        <p className="text-white text-base sm:text-lg mb-7 max-w-md drop-shadow-md">
          {subtext}
        </p>
        <Button variant="primary" size="xl" asChild>
          <Link href={buttonLink}>{buttonText}</Link>
        </Button>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryStrip({ categories, loading }) {
  const [openId, setOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!openId) return;
    const close = () => setOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openId]);

  const openCat = categories.find((c) => c._id === openId);

  return (
    <section className="py-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Shop by Category</h2>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-px-4 -mx-4 px-4 pb-1">
          {loading || !categories.length
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 w-20 snap-start">
                  <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
                </div>
              ))
            : categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS[cat.name] || Package;
                const hasChildren = cat.children?.length > 0;
                const isOpen = openId === cat._id;

                const Avatar = ({ active }) => cat.image ? (
                  <div className={`relative w-14 h-14 rounded-full overflow-hidden ring-2 transition-colors ${active ? 'ring-alibaba-500' : 'ring-transparent group-hover:ring-alibaba-200'}`}>
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="56px" />
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-alibaba-100' : 'bg-gray-100 group-hover:bg-alibaba-50'}`}>
                    <Icon className={`h-6 w-6 transition-colors ${active ? 'text-alibaba-600' : 'text-gray-700 group-hover:text-alibaba-600'}`} />
                  </div>
                );

                if (hasChildren) {
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isOpen) { setOpenId(null); return; }
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 - 96 });
                        setOpenId(cat._id);
                      }}
                      className="group flex flex-col items-center gap-2 text-center flex-shrink-0 w-20 snap-start"
                    >
                      <Avatar active={isOpen} />
                      <p className={`text-xs font-medium transition-colors line-clamp-2 flex items-center gap-0.5 ${isOpen ? 'text-alibaba-600' : 'text-gray-600 group-hover:text-alibaba-600'}`}>
                        {cat.name} <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </p>
                    </button>
                  );
                }

                return (
                  <Link
                    key={cat._id}
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="group flex flex-col items-center gap-2 text-center flex-shrink-0 w-20 snap-start"
                  >
                    <Avatar active={false} />
                    <p className="text-xs font-medium text-gray-600 group-hover:text-alibaba-600 transition-colors line-clamp-2">
                      {cat.name}
                    </p>
                  </Link>
                );
              })
          }
        </div>
      </div>

      {/* Dropdown rendered outside overflow container */}
      {openId && openCat && (
        <div
          className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] w-48 py-1"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={`/products?category=${encodeURIComponent(openCat.name)}`}
            onClick={() => setOpenId(null)}
            className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            All in {openCat.name}
          </Link>
          <div className="border-t border-gray-100 my-1" />
          {openCat.children.map((sub) => {
            const SubIcon = CATEGORY_ICONS[sub.icon] || CATEGORY_ICONS[sub.name] || Package;
            return (
              <Link
                key={sub._id}
                href={`/products?category=${encodeURIComponent(sub.name)}`}
                onClick={() => setOpenId(null)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-alibaba-600 transition-colors"
              >
                <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const dealScrollRef = useRef(null);
  const [dealProducts, setDealProducts] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [siteSettings, setSiteSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Browse by Category — infinite scroll state
  const [activeCategory, setActiveCategory] = useState('');
  const [catProducts, setCatProducts] = useState([]);
  const [catPage, setCatPage] = useState(1);
  const [catHasMore, setCatHasMore] = useState(true);
  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingMoreCat, setLoadingMoreCat] = useState(false);
  const CAT_LIMIT = 20;

  useEffect(() => {
    api.get('/products/featured')
      .then((res) => setDealProducts(res.data?.products || []))
      .catch(() => setDealProducts([]))
      .finally(() => setLoadingDeals(false));

    api.get('/site-settings')
      .then((res) => setSiteSettings(res.data?.settings || null))
      .catch(() => setSiteSettings(null));

    api.get('/categories')
      .then((res) => setCategories(res.data.tree || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Reset and load page 1 whenever active category changes
  useEffect(() => {
    setCatProducts([]);
    setCatPage(1);
    setCatHasMore(true);
    setLoadingCat(true);
    const params = { limit: CAT_LIMIT, page: 1 };
    if (activeCategory) params.category = activeCategory;
    api.get('/products', { params })
      .then((res) => {
        const prods = res.data?.products || [];
        setCatProducts(prods);
        setCatHasMore(prods.length === CAT_LIMIT);
      })
      .catch(() => setCatProducts([]))
      .finally(() => setLoadingCat(false));
  }, [activeCategory]);

  // Load next page
  const loadMoreCat = useCallback(async () => {
    if (loadingMoreCat || !catHasMore) return;
    setLoadingMoreCat(true);
    const nextPage = catPage + 1;
    const params = { limit: CAT_LIMIT, page: nextPage };
    if (activeCategory) params.category = activeCategory;
    try {
      const res = await api.get('/products', { params });
      const prods = res.data?.products || [];
      setCatProducts((prev) => [...prev, ...prods]);
      setCatPage(nextPage);
      setCatHasMore(prods.length === CAT_LIMIT);
    } catch {
      // silently ignore
    } finally {
      setLoadingMoreCat(false);
    }
  }, [loadingMoreCat, catHasMore, catPage, activeCategory]);

  return (
    <div>
      <Hero settings={siteSettings} />
      <CategoryStrip categories={categories} loading={loadingCategories} />

      {/* Deal of the Day */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Deal of the Day</h2>
              <CountdownTimer />
            </div>
            <div className="flex items-center gap-2">
              {/* Arrow buttons — desktop */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => dealScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => dealScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <Link
                href="/products"
                className="flex items-center gap-1 text-sm font-semibold text-alibaba-600 hover:text-alibaba-700 bg-alibaba-50 hover:bg-alibaba-100 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {loadingDeals ? (
            <div className="flex gap-3 sm:gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[42%] sm:w-[31%] md:w-[23.5%] lg:w-[18.4%]">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : dealProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No deals yet</p>
              <p className="text-sm mt-1">Check back soon for exclusive offers</p>
            </div>
          ) : (
            <div
              ref={dealScrollRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2"
              style={{ scrollPadding: '1rem', WebkitOverflowScrolling: 'touch' }}
            >
              {dealProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex-shrink-0 snap-start w-[42vw] sm:w-[30vw] md:w-[22vw] lg:w-[17vw] max-w-[220px]"
                >
                  <DealProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Browse by Category — tabbed product section */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Browse by Category</h2>
            <Link href={activeCategory ? `/products?category=${encodeURIComponent(activeCategory)}` : '/products'}
              className="text-alibaba-600 text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Category text tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-8 border-b border-gray-100">
            <button
              onClick={() => setActiveCategory('')}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeCategory === ''
                  ? 'border-alibaba-600 text-alibaba-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeCategory === cat.name
                    ? 'border-alibaba-600 text-alibaba-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          {loadingCat ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: CAT_LIMIT }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : catProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No products in this category yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {catProducts.map((product) => <BestSellingCard key={product._id} product={product} />)}
                {/* Skeleton tiles while loading next page */}
                {loadingMoreCat && Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={`more-${i}`} />)}
              </div>
              {catHasMore ? (
                <div className="flex justify-center mt-8">
                  <Button variant="outline" onClick={loadMoreCat} disabled={loadingMoreCat}>
                    {loadingMoreCat ? 'Loading…' : 'View More'}
                  </Button>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 mt-4">All products loaded</p>
              )}
            </>
          )}
        </div>
      </section>

      <TrustBadges />

      {/* CTA Banner */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Grow Your Business?</h2>
          <p className="text-gray-300 text-lg mb-8">Join thousands of sellers already growing on Noah Attire. List your products for free.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="primary" asChild>
              <Link href="/register">Start Selling — It&apos;s Free</Link>
            </Button>
            <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
