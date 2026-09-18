'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { CATEGORIES, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Upload, User, Globe } from 'lucide-react';

export default function SellerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    category: '',
    location: '',
    phone: '',
    website: '',
    logo: '',
  });

  useEffect(() => {
    api.get('/sellers/me/profile')
      .then((res) => {
        const p = res.data.profile;
        setProfile(p);
        setForm({
          businessName: p.businessName || '',
          description: p.description || '',
          category: p.category || '',
          location: p.location || '',
          phone: p.phone || '',
          website: p.website || '',
          logo: p.logo || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((p) => ({ ...p, logo: res.data.url }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/sellers/me/profile', form);
      setProfile(res.data.profile);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
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

  const displayName = form.businessName || profile?.userId?.name || 'Your Business';

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-600">Business Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your profile is visible to all buyers on the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              {form.logo ? (
                <Image
                  src={form.logo}
                  alt="Business logo"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-navy-600 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-white text-2xl font-bold">{getInitials(displayName)}</span>
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
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG or WebP, max 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business / Company Name</Label>
              <Input
                id="businessName"
                placeholder="e.g. Sunrise Industrial Supplies"
                value={form.businessName}
                onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your business, products, and services. What makes you unique?"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Primary Industry / Category</Label>
                <Select
                  value={form.category || 'none'}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="location">Business Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Karachi, Pakistan"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Website (optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Note */}
        <div className="bg-navy-50 border border-navy-100 rounded-lg px-4 py-3 text-sm text-navy-700">
          <p className="font-medium mb-0.5">Profile Visibility</p>
          <p className="text-xs text-navy-500">
            Your business profile is publicly visible to all buyers. A complete profile increases trust and inquiry rates.
          </p>
        </div>

        <Button type="submit" size="lg" disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : (
            'Save Profile'
          )}
        </Button>
      </form>
    </div>
  );
}
