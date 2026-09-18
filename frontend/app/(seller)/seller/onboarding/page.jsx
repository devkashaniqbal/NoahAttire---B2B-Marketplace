'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { CATEGORIES, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Building2, Loader2, Upload, X, ArrowRight, ArrowLeft,
  CheckCircle, Package, Plus, MapPin, Phone, Globe,
} from 'lucide-react';

const TOTAL_STEPS = 3;

const EMPTY_PRODUCT = {
  title: '', description: '', category: '', unit: 'piece',
  minOrderQty: 1, location: '', tags: '', images: [],
  priceRange: { min: '', max: '' },
};

function StepIndicator({ current }) {
  const steps = ['Business Info', 'Description & Logo', 'First Product'];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                done ? 'bg-navy-600 border-navy-600 text-white' :
                active ? 'bg-white border-navy-600 text-navy-600' :
                'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${active ? 'text-navy-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-24 mx-1 mb-5 ${step < current ? 'bg-navy-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SellerOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Step 1 — Business Info
  const [info, setInfo] = useState({
    businessName: '', category: '', location: '', phone: '', website: '',
  });

  // Step 2 — Description + Logo
  const [desc, setDesc] = useState('');
  const [logo, setLogo] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Step 3 — Optional first product
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSaved, setProductSaved] = useState(false);

  const [saving, setSaving] = useState(false);

  // Check if profile already complete → skip to dashboard
  useEffect(() => {
    api.get('/sellers/me/profile')
      .then((res) => {
        const p = res.data.profile;
        if (p.businessName) {
          // Already onboarded — go to dashboard
          router.replace('/seller/dashboard');
        } else {
          setCheckingProfile(false);
        }
      })
      .catch(() => setCheckingProfile(false));
  }, [router]);

  if (checkingProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  // ── Step 1 Save ──────────────────────────────────────────────
  const saveStep1 = async () => {
    if (!info.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }
    setSaving(true);
    try {
      await api.put('/sellers/me/profile', { ...info });
      setStep(2);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2 Save ──────────────────────────────────────────────
  const saveStep2 = async () => {
    setSaving(true);
    try {
      await api.put('/sellers/me/profile', { ...info, description: desc, logo });
      setStep(3);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogo(res.data.url);
      toast.success('Logo uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Step 3 — First Product ────────────────────────────────────
  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (productForm.images.length >= 5) { toast.error('Max 5 images'); return; }
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProductForm((p) => ({ ...p, images: [...p.images, res.data.url] }));
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImg(false);
    }
  };

  const saveProduct = async () => {
    if (!productForm.title || !productForm.category || !productForm.priceRange.min || !productForm.priceRange.max) {
      toast.error('Title, category, and price range are required');
      return;
    }
    setSavingProduct(true);
    try {
      await api.post('/products', {
        ...productForm,
        tags: productForm.tags ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        priceRange: { min: Number(productForm.priceRange.min), max: Number(productForm.priceRange.max) },
        minOrderQty: Number(productForm.minOrderQty),
      });
      toast.success('Product listed!');
      setProductSaved(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const finish = () => router.push('/seller/dashboard');

  const displayName = info.businessName || user?.name || 'Your Business';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-bold text-xl text-navy-600 mb-3">
            <Building2 className="h-6 w-6 text-gold-500" />
            Noah <span className="text-gold-500">Attire</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Seller Store</h1>
          <p className="text-gray-500 text-sm mt-1">Complete your profile to start receiving buyer inquiries</p>
        </div>

        <StepIndicator current={step} />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* ─── STEP 1: Business Info ───────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-navy-600 mb-1">Tell us about your business</h2>
                <p className="text-gray-500 text-sm">This information will appear on your public seller profile.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessName">Business / Company Name <span className="text-red-500">*</span></Label>
                <Input
                  id="businessName"
                  placeholder="e.g. Sunrise Industrial Supplies"
                  value={info.businessName}
                  onChange={(e) => setInfo((p) => ({ ...p, businessName: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary Industry</Label>
                  <Select
                    value={info.category || 'none'}
                    onValueChange={(v) => setInfo((p) => ({ ...p, category: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific category</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">
                    <MapPin className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Karachi, Pakistan"
                    value={info.location}
                    onChange={(e) => setInfo((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    <Phone className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                    Business Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={info.phone}
                    onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website">
                    <Globe className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={info.website}
                    onChange={(e) => setInfo((p) => ({ ...p, website: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveStep1} disabled={saving} size="lg" className="min-w-[140px]">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Description + Logo ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-navy-600 mb-1">Add your logo & description</h2>
                <p className="text-gray-500 text-sm">Help buyers learn more about what makes your business unique.</p>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-5">
                  {logo ? (
                    <div className="relative">
                      <Image
                        src={logo}
                        alt="Logo"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-navy-600 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{getInitials(displayName)}</span>
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </label>
                    <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP · max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your business, products, and what makes you stand out. Include your experience, certifications, and export capabilities..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={5}
                />
                <p className="text-xs text-gray-400">{desc.length}/500 characters recommended</p>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(3)} size="lg">
                    Skip for now
                  </Button>
                  <Button onClick={saveStep2} disabled={saving} size="lg" className="min-w-[140px]">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: First Product ───────────────────────────── */}
          {step === 3 && (
            <div>
              {productSaved ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Your store is live. Buyers can now find your profile and products on Noah Attire.
                  </p>
                  <Button size="lg" onClick={finish} className="min-w-[200px]">
                    Go to My Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-navy-600 mb-1">List your first product</h2>
                    <p className="text-gray-500 text-sm">
                      Products with complete info get 3× more inquiries. You can add more later.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Product Title <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. Industrial Water Pump 5HP"
                      value={productForm.title}
                      onChange={(e) => setProductForm((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Specifications, features, certifications..."
                      value={productForm.description}
                      onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Category <span className="text-red-500">*</span></Label>
                      <Select
                        value={productForm.category || 'none'}
                        onValueChange={(v) => setProductForm((p) => ({ ...p, category: v === 'none' ? '' : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select category</SelectItem>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <Input
                        placeholder="piece / kg / ton"
                        value={productForm.unit}
                        onChange={(e) => setProductForm((p) => ({ ...p, unit: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Min Price (USD) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={productForm.priceRange.min}
                        onChange={(e) => setProductForm((p) => ({ ...p, priceRange: { ...p.priceRange, min: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max Price (USD) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={productForm.priceRange.max}
                        onChange={(e) => setProductForm((p) => ({ ...p, priceRange: { ...p.priceRange, max: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Min. Order</Label>
                      <Input
                        type="number"
                        min="1"
                        value={productForm.minOrderQty}
                        onChange={(e) => setProductForm((p) => ({ ...p, minOrderQty: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Origin / Location</Label>
                      <Input
                        placeholder="e.g. Shenzhen, China"
                        value={productForm.location}
                        onChange={(e) => setProductForm((p) => ({ ...p, location: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        placeholder="industrial, pump, water"
                        value={productForm.tags}
                        onChange={(e) => setProductForm((p) => ({ ...p, tags: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div className="space-y-2">
                    <Label>Product Images (optional, max 5)</Label>
                    <div className="flex flex-wrap gap-2">
                      {productForm.images.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200">
                          <Image src={url} alt="" fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductForm((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {productForm.images.length < 5 && (
                        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-navy-400 transition-colors">
                          {uploadingImg ? <Loader2 className="h-5 w-5 animate-spin text-navy-400" /> : (
                            <>
                              <Upload className="h-5 w-5 text-gray-400" />
                              <span className="text-xs text-gray-400 mt-1">Add</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} disabled={uploadingImg} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(2)} size="lg">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={finish} size="lg">
                        Skip — Go to Dashboard
                      </Button>
                      <Button onClick={saveProduct} disabled={savingProduct} size="lg" className="min-w-[140px]">
                        {savingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        List Product
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Step {step} of {TOTAL_STEPS}
          <div className="mt-2 h-1 bg-gray-200 rounded-full max-w-xs mx-auto">
            <div
              className="h-1 bg-navy-600 rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
