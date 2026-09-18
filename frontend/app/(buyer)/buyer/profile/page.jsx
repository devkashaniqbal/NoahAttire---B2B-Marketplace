'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Building2, FileText, Bell, Plus, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BuyerProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', companyName: '', taxId: '' });
  const [notif, setNotif] = useState({ email: true, sms: false, push: true });
  const [addresses, setAddresses] = useState([]);
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  useEffect(() => {
    api.get('/auth/me').then((res) => {
      const u = res.data.user;
      setUser(u);
      setForm({ name: u.name || '', companyName: u.companyName || '', taxId: u.taxId || '' });
      setNotif(u.notificationSettings || { email: true, sms: false, push: true });
      setAddresses(u.companyAddresses || []);
    }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/me', { ...form, notificationSettings: notif, companyAddresses: addresses });
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addAddress = () => {
    setAddresses([...addresses, { label: '', line1: '', city: '', country: '', isDefault: addresses.length === 0 }]);
  };

  const updateAddress = (i, field, value) => {
    const next = [...addresses];
    next[i] = { ...next[i], [field]: value };
    setAddresses(next);
  };

  const removeAddress = (i) => setAddresses(addresses.filter((_, idx) => idx !== i));

  const addDocument = async () => {
    if (!docName.trim() || !docUrl.trim()) return toast.error('Document name and URL are required');
    try {
      const res = await api.post('/auth/me/documents', { name: docName, url: docUrl });
      setUser(res.data.user);
      setDocName('');
      setDocUrl('');
      toast.success('Document added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add document');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold">Profile & Company</h1>
          <p className="text-navy-200 text-sm mt-1">Manage your account, company info, addresses, and documents</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Account & Company */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5"><User className="h-4 w-4" /> Account Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>

          <h2 className="text-sm font-bold text-gray-900 mt-6 mb-4 flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Company Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div>
              <Label>Tax ID</Label>
              <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Company Addresses</h2>
            <Button size="sm" variant="ghost" onClick={addAddress}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
          </div>
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-400">No addresses added yet</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((a, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end border-b border-gray-50 pb-3 last:border-0">
                  <Input placeholder="Label" value={a.label} onChange={(e) => updateAddress(i, 'label', e.target.value)} />
                  <Input placeholder="Address line" value={a.line1} onChange={(e) => updateAddress(i, 'line1', e.target.value)} />
                  <Input placeholder="City" value={a.city} onChange={(e) => updateAddress(i, 'city', e.target.value)} />
                  <div className="flex gap-2">
                    <Input placeholder="Country" value={a.country} onChange={(e) => updateAddress(i, 'country', e.target.value)} />
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => removeAddress(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5"><FileText className="h-4 w-4" /> Documents</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Document name" value={docName} onChange={(e) => setDocName(e.target.value)} />
            <Input placeholder="Document URL" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
            <Button size="sm" onClick={addDocument}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          {user?.documents?.length > 0 ? (
            <div className="space-y-2">
              {user.documents.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-gray-700 hover:text-navy-600 py-1.5 border-b border-gray-50 last:border-0">
                  {d.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No documents uploaded</p>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5"><Bell className="h-4 w-4" /> Notification Settings</h2>
          <div className="space-y-2">
            {['email', 'sms', 'push'].map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                <input type="checkbox" checked={notif[k]} onChange={(e) => setNotif({ ...notif, [k]: e.target.checked })} />
                {k} notifications
              </label>
            ))}
          </div>
        </div>

        <Button onClick={saveProfile} disabled={saving} size="lg">{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}
