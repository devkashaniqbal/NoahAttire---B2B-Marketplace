'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import InquiryForm from '@/components/shared/InquiryForm';
import OrderForm from '@/components/shared/OrderForm';
import RFQForm from '@/components/shared/RFQForm';
import ProductCard from '@/components/shared/ProductCard';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getInitials, CATEGORY_ICONS, titleCase } from '@/lib/utils';
import {
  MapPin, Package, Phone, ChevronLeft, ChevronRight,
  Send, Globe, ShoppingCart, FileText, CheckCircle2,
  BadgeCheck, ShieldCheck, Truck, MessageSquare,
  Building2, Star, Award, Clock, ThumbsUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Description', 'Specifications', 'Reviews', 'Supplier Info'];

export default function ProductDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const { user } = useAuth();

  const [product, setProduct]                   = useState(null);
  const [sellerProfile, setSellerProfile]       = useState(null);
  const [related, setRelated]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [activeImage, setActiveImage]           = useState(0);
  const [activeTab, setActiveTab]               = useState('Description');
  const [selectedVariants, setSelectedVariants] = useState({});
  const [inquiryOpen, setInquiryOpen]           = useState(false);
  const [orderOpen, setOrderOpen]               = useState(false);
  const [rfqOpen, setRfqOpen]                   = useState(false);
  const [reviewRating, setReviewRating]         = useState(0);
  const [reviewHover, setReviewHover]           = useState(0);
  const [reviewComment, setReviewComment]       = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError]           = useState('');
  const [localReviews, setLocalReviews]         = useState(null);
  const [localAvg, setLocalAvg]                 = useState(null);
  const [localCount, setLocalCount]             = useState(null);

  const goAuth = () => router.push(`/register?role=buyer&redirect=/products/${id}`);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(async (res) => {
        const p = res.data.product;
        setProduct(p);
        setActiveImage(0);
        const sid = p.sellerId?._id || p.sellerId;
        if (sid) api.get(`/sellers/user/${sid}`).then((r) => setSellerProfile(r.data.profile)).catch(() => {});
        const primaryCategory = Array.isArray(p.category) ? p.category[0] : p.category;
        api.get('/products', { params: { category: primaryCategory, limit: 7 } })
          .then((r) => setRelated((r.data.products || []).filter((x) => x._id !== p._id).slice(0, 6)))
          .catch(() => {});
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!product)  return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Product not found</h2>
      <Button asChild><Link href="/products">Browse Products</Link></Button>
    </div>
  );

  const sellerName   = product.brandName || (sellerProfile?.businessName && titleCase(sellerProfile.businessName)) || product.sellerId?.name || 'Verified Seller';
  const moq          = product.minOrderQty || 1;
  const unit         = product.unit || 'units';
  const images       = product.images || [];
  const categories   = Array.isArray(product.category) ? product.category : [product.category].filter(Boolean);
  const subCategories = Array.isArray(product.subCategory) ? product.subCategory : [product.subCategory].filter(Boolean);
  const primaryCategory = categories[0];
  const CatIcon      = CATEGORY_ICONS[primaryCategory] || Package;
  const isSeller     = user?.role === 'seller';
  const reviews      = localReviews ?? product.reviews ?? [];
  const avgRating    = localAvg    ?? product.avgRating   ?? 0;
  const reviewCount  = localCount  ?? product.reviewCount ?? 0;
  const alreadyReviewed = user ? reviews.some((r) => r.userId === user.userId) : false;

  const submitReview = async () => {
    if (!reviewRating) { setReviewError('Please select a star rating'); return; }
    if (!reviewComment.trim()) { setReviewError('Please write a comment'); return; }
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const res = await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment.trim() });
      setLocalReviews([...reviews, {
        userId: user.userId, userName: user.name || 'You',
        rating: reviewRating, comment: reviewComment.trim(), createdAt: new Date().toISOString(),
      }]);
      setLocalAvg(res.data.avgRating);
      setLocalCount(res.data.reviewCount);
      setReviewRating(0);
      setReviewComment('');
      toast.success('Review submitted!');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>

      {/* ─── Dark header bar ─── */}
      <div className="bg-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-navy-300 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-navy-500">/</span>
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <span className="text-navy-500">/</span>
            <Link href={`/products?category=${encodeURIComponent(primaryCategory)}`} className="hover:text-white transition-colors">{primaryCategory}</Link>
            <span className="text-navy-500">/</span>
            <span className="text-white truncate max-w-[220px]">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">

        {/* ─── Main two-column panel ─── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* LEFT — Gallery */}
            <div className="border-b lg:border-b-0 lg:border-r border-gray-100">
              {/* Main image */}
              <div className="relative aspect-square bg-gray-50">
                {images[activeImage] ? (
                  <Image
                    src={images[activeImage]}
                    alt={product.title}
                    fill
                    className="object-contain p-6"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-300">
                    <CatIcon className="h-24 w-24" />
                    <span className="text-sm font-medium text-gray-400">{primaryCategory}</span>
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((p) => Math.max(0, p - 1))}
                      disabled={activeImage === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30 hover:shadow-lg transition-shadow"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setActiveImage((p) => Math.min(images.length - 1, p + 1))}
                      disabled={activeImage === images.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30 hover:shadow-lg transition-shadow"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto border-t border-gray-100 bg-gray-50">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                        activeImage === i
                          ? 'ring-2 ring-alibaba-600 ring-offset-1 shadow-md'
                          : 'ring-1 ring-gray-200 hover:ring-gray-400'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust row */}
              <div className="grid grid-cols-3 gap-0 border-t border-gray-100">
                {[
                  { icon: ShieldCheck, label: 'Verified', sub: 'Supplier' },
                  { icon: Truck,       label: 'Fast',     sub: 'Shipping' },
                  { icon: Award,       label: 'Quality',  sub: 'Assured' },
                ].map(({ icon: Icon, label, sub }, i) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-alibaba-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-alibaba-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{label}</p>
                      <p className="text-[11px] text-gray-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Info */}
            <div className="flex flex-col">
              <div className="p-6 sm:p-8 flex-1">

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-5">
                  {product.title}
                </h1>

                {/* Rating display */}
                {reviewCount > 0 && (
                  <button
                    onClick={() => setActiveTab('Reviews')}
                    className="flex items-center gap-2 mb-4 group"
                  >
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-amber-500">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-400 group-hover:underline">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                  </button>
                )}

                {/* Variants */}
                {product.variants?.length > 0 && (
                  <div className="space-y-4 mb-5 pb-5 border-b border-gray-100">
                    {product.variants.map((variant) => (
                      <div key={variant.name}>
                        <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          {variant.name}
                          {selectedVariants[variant.name] && (
                            <span className="font-medium text-alibaba-600 text-sm">— {selectedVariants[variant.name]}</span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((opt, optIdx) => {
                            const sel = selectedVariants[variant.name] === opt;
                            const isFirstVariant = variant === product.variants[0];
                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [variant.name]: sel ? undefined : opt,
                                  }));
                                  if (isFirstVariant && !sel && images[optIdx] !== undefined) {
                                    setActiveImage(optIdx);
                                  }
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                                  sel
                                    ? 'bg-navy-600 text-white border-navy-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-navy-400 hover:text-navy-600'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => { if (!user) { goAuth(); return; } if (user.role !== 'buyer') { toast.error('Only buyer accounts can place orders'); return; } setOrderOpen(true); }}
                    className="w-full flex items-center justify-center gap-3 bg-navy-600 hover:bg-navy-700 active:bg-navy-800 text-white font-bold text-base py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Place Order
                  </button>
                  {!isSeller && (
                    <button
                      onClick={() => { if (!user) { goAuth(); return; } if (user.role !== 'buyer') { toast.error('Only buyer accounts can request quotes'); return; } setRfqOpen(true); }}
                      className="w-full flex items-center justify-center gap-3 bg-alibaba-600 hover:bg-alibaba-700 active:bg-alibaba-800 text-white font-bold text-base py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <FileText className="h-5 w-5" />
                      Request a Quote
                    </button>
                  )}
                  {!isSeller && (
                    <button
                      onClick={() => { if (!user) { goAuth(); return; } setInquiryOpen(true); }}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-base py-3.5 rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300"
                    >
                      <MessageSquare className="h-5 w-5 text-gray-500" />
                      Send Inquiry to Seller
                    </button>
                  )}
                </div>

                {/* Seller mini-card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Sold By</p>
                  <div className="flex items-center gap-3">
                    {sellerProfile?.logo ? (
                      <Image src={sellerProfile.logo} alt={sellerName} width={48} height={48}
                        className="rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-navy-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{getInitials(sellerName)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 flex items-center gap-1.5 truncate">
                        {sellerName}
                        <BadgeCheck className="h-4 w-4 text-navy-500 flex-shrink-0" />
                      </p>
                      {sellerProfile?.location && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{sellerProfile.location}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => { if (!user) { goAuth(); return; } setInquiryOpen(true); }}
                      className="flex-shrink-0 text-xs font-semibold text-alibaba-600 hover:text-alibaba-700 bg-alibaba-50 hover:bg-alibaba-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs section ─── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-7 py-4 text-sm font-bold border-b-[3px] transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-navy-600 text-navy-600 bg-navy-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-10">

            {/* Description tab */}
            {activeTab === 'Description' && (
              <div className="max-w-3xl">
                <div
                  className="product-description text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description || '<p>No description provided.</p>' }}
                />
                {product.tags?.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="text-base font-bold text-gray-800 mb-4">Key Features</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.tags.map((tag) => (
                        <li key={tag} className="flex items-start gap-3">
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-navy-600" />
                          </span>
                          <span className="text-sm text-gray-700 font-medium">{tag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Specifications tab */}
            {activeTab === 'Specifications' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Product Specifications</h2>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ['Product Name',      product.title],
                        ['Category',          categories.join(', ')],
                        ...(subCategories.length ? [['Subcategory', subCategories.join(', ')]] : []),
                        ['Min. Order Qty',    `${moq} ${unit}`],
                        ['Unit',              unit],
                        ['Origin',            product.location || '—'],
                        ...(product.tags?.length ? [['Tags / Keywords', product.tags.join(', ')]] : []),
                        ...(product.variants?.map((v) => [v.name + ' Options', v.options.join(', ')]) || []),
                      ].map(([label, value], i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 font-semibold text-gray-500 w-2/5 border-b border-gray-100">{label}</td>
                          <td className="px-6 py-4 text-gray-900 font-medium border-b border-gray-100">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === 'Reviews' && (
              <div className="max-w-2xl space-y-8">

                {/* Rating summary */}
                <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-center flex-shrink-0">
                    <p className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 justify-center mt-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const pct   = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-gray-500 font-medium">{star}</span>
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right text-gray-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write a review */}
                {user?.role === 'buyer' && !alreadyReviewed && (
                  <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg">Write a Review</h3>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2">Your Rating</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <button
                            key={s}
                            onMouseEnter={() => setReviewHover(s)}
                            onMouseLeave={() => setReviewHover(0)}
                            onClick={() => setReviewRating(s)}
                          >
                            <Star className={`h-8 w-8 transition-colors ${s <= (reviewHover || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm font-semibold text-gray-600 self-center">
                            {['','Terrible','Poor','Average','Good','Excellent'][reviewRating]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2">Your Comment</p>
                      <textarea
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      />
                    </div>
                    {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
                    <button
                      onClick={submitReview}
                      disabled={reviewSubmitting}
                      className="flex items-center gap-2 bg-navy-600 hover:bg-navy-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </div>
                )}
                {alreadyReviewed && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    You have already reviewed this product.
                  </div>
                )}
                {!user && (
                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                    <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Sign in as a buyer to leave a review</p>
                    <button onClick={goAuth} className="text-sm font-semibold text-navy-600 hover:underline">Sign in →</button>
                  </div>
                )}

                {/* Review list */}
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Star className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm">Be the first to review this product</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg">Customer Reviews</h3>
                    {reviews.map((r, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{(r.userName || 'A')[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{r.userName}</p>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {[1,2,3,4,5].map((s) => (
                                  <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pl-12">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Supplier Info tab */}
            {activeTab === 'Supplier Info' && (
              <div className="max-w-2xl space-y-6">
                {/* Supplier header */}
                <div className="flex items-start gap-5 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  {sellerProfile?.logo ? (
                    <Image src={sellerProfile.logo} alt={sellerName} width={80} height={80}
                      className="rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-navy-600 to-alibaba-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-2xl">{getInitials(sellerName)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                      {sellerName}
                      <BadgeCheck className="h-5 w-5 text-navy-500 flex-shrink-0" />
                    </h3>
                    {sellerProfile?.description && (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{sellerProfile.description}</p>
                    )}
                  </div>
                </div>

                {/* Supplier detail grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: MapPin,    label: 'Location',     value: sellerProfile?.location },
                    { icon: Phone,     label: 'Phone',        value: sellerProfile?.phone },
                    { icon: Globe,     label: 'Website',      value: sellerProfile?.website, link: true },
                    { icon: Building2, label: 'Business',     value: sellerProfile?.businessName && titleCase(sellerProfile.businessName) },
                  ].filter((r) => r.value).map(({ icon: Icon, label, value, link }) => (
                    <div key={label} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                      <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4.5 w-4.5 text-navy-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                        {link ? (
                          <a href={value} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-semibold text-alibaba-600 hover:underline truncate block">
                            {value.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!isSeller && (
                  <button
                    onClick={() => { if (!user) { goAuth(); return; } setInquiryOpen(true); }}
                    className="flex items-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                    Contact This Supplier
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Related Products ─── */}
        {related.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">More in {primaryCategory}</h2>
              <Link href={`/products?category=${encodeURIComponent(primaryCategory)}`}
                className="text-sm font-semibold text-alibaba-600 hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* ─── Dialogs ─── */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Send Inquiry to Seller</DialogTitle></DialogHeader>
          <InquiryForm productId={product._id} productTitle={product.title} onSuccess={() => setInquiryOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={rfqOpen} onOpenChange={setRfqOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Request a Quote</DialogTitle></DialogHeader>
          <RFQForm product={product} onSuccess={() => { setRfqOpen(false); router.push('/buyer/rfqs'); }} />
        </DialogContent>
      </Dialog>
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Place Order</DialogTitle></DialogHeader>
          <OrderForm product={product} onSuccess={() => { setOrderOpen(false); router.push('/orders'); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>
      <div className="bg-navy-700 h-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="bg-white rounded-xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4 py-4">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-7 w-3/4 rounded-lg" />
              <Skeleton className="h-24 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
