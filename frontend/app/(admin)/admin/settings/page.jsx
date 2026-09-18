'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminSiteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(null); // index of banner slot being uploaded
  const [form, setForm] = useState({
    logoUrl: '',
    heroImage: '',
    heroBanners: [],
    heroHeadline: '',
    heroSubtext: '',
    heroButtonText: '',
    heroButtonLink: '',
  });

  useEffect(() => {
    api.get('/site-settings')
      .then((res) => {
        const s = res.data.settings;
        setForm({
          logoUrl: s.logoUrl || '',
          heroImage: s.heroImage || '',
          heroBanners: s.heroBanners || [],
          heroHeadline: s.heroHeadline || '',
          heroSubtext: s.heroSubtext || '',
          heroButtonText: s.heroButtonText || '',
          heroButtonLink: s.heroButtonLink || '',
        });
      })
      .catch(() => toast.error('Failed to load site settings'))
      .finally(() => setLoading(false));
  }, []);

  const uploadImage = async (file, field, setUploading) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((p) => ({ ...p, [field]: res.data.url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const uploadBanner = async (file, index) => {
    setUploadingBanner(index);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((p) => {
        const banners = [...p.heroBanners];
        banners[index] = res.data.url;
        return { ...p, heroBanners: banners };
      });
      toast.success('Banner uploaded');
    } catch {
      toast.error('Failed to upload banner');
    } finally {
      setUploadingBanner(null);
    }
  };

  const removeBanner = (index) => {
    setForm((p) => ({ ...p, heroBanners: p.heroBanners.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/site-settings', form);
      toast.success('Site settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update site settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-600">Site Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Control the platform logo and homepage hero section shown to all visitors
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              {form.logoUrl ? (
                <Image
                  src={form.logoUrl}
                  alt="Platform logo"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-xl object-contain border-2 border-gray-200 bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-navy-600 flex items-center justify-center border-2 border-gray-200">
                  <ImageIcon className="h-8 w-8 text-white/60" />
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, 'logoUrl', setUploadingLogo);
                    }}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG or WebP, max 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Homepage Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Banner Slider (up to 3 images)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => {
                  const src = form.heroBanners[i];
                  return (
                    <div key={i} className="space-y-2">
                      {src ? (
                        <div className="relative">
                          <Image
                            src={src}
                            alt={`Banner ${i + 1}`}
                            width={200}
                            height={120}
                            className="w-full h-24 rounded-lg object-cover border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeBanner(i)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <label className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          {uploadingBanner === i ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          {uploadingBanner === i ? 'Uploading...' : src ? 'Replace' : `Upload Banner ${i + 1}`}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingBanner !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadBanner(file, i);
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">These rotate automatically on the homepage. Falls back to a default slider if left empty.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="heroHeadline">Headline</Label>
              <Input
                id="heroHeadline"
                placeholder="e.g. SOURCE THE LATEST PRODUCTS ONLINE"
                value={form.heroHeadline}
                onChange={(e) => setForm((p) => ({ ...p, heroHeadline: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="heroSubtext">Subtext</Label>
              <Textarea
                id="heroSubtext"
                placeholder="Short supporting line under the headline"
                value={form.heroSubtext}
                onChange={(e) => setForm((p) => ({ ...p, heroSubtext: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="heroButtonText">Button Text</Label>
                <Input
                  id="heroButtonText"
                  placeholder="e.g. SHOP NOW"
                  value={form.heroButtonText}
                  onChange={(e) => setForm((p) => ({ ...p, heroButtonText: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heroButtonLink">Button Link</Label>
                <Input
                  id="heroButtonLink"
                  placeholder="e.g. /products"
                  value={form.heroButtonLink}
                  onChange={(e) => setForm((p) => ({ ...p, heroButtonLink: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : (
            'Save Site Settings'
          )}
        </Button>
      </form>
    </div>
  );
}
