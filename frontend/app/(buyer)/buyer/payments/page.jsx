'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Wallet, Upload, Loader2, Clock, CheckCircle2, XCircle, Plus, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', color: 'bg-amber-100 text-amber-700',  icon: Clock },
  verified: { label: 'Verified',       color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected',       color: 'bg-red-100 text-red-700',     icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function BuyerPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ orderId: '', amount: '', method: 'Bank Transfer', screenshotUrl: '', notes: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, ordersRes] = await Promise.all([
        api.get('/payments/mine'),
        api.get('/orders/mine', { params: { limit: 50 } }),
      ]);
      setPayments(paymentsRes.data.payments || []);
      setOrders(ordersRes.data.orders || []);
    } catch {
      setPayments([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDialog = () => {
    setForm({ orderId: '', amount: '', method: 'Bank Transfer', screenshotUrl: '', notes: '' });
    setDialogOpen(true);
  };

  const handleOrderSelect = (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    setForm((p) => ({ ...p, orderId, amount: order?.totalAmount || '' }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((p) => ({ ...p, screenshotUrl: res.data.url }));
      toast.success('Screenshot uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.amount || !form.screenshotUrl) {
      toast.error('Select an order, enter the amount, and upload your payment screenshot');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/payments', form);
      toast.success('Payment proof submitted to seller');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payments &amp; Billing</h1>
            <p className="text-navy-200 text-sm mt-1">Submit payment proof for your orders</p>
          </div>
          <Button variant="primary" onClick={openDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Payment
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No payments submitted yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload a screenshot of your bank transfer to confirm an order payment</p>
            <Button className="mt-4" size="sm" variant="primary" onClick={openDialog}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Submit Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment._id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={payment.screenshotUrl} alt="Payment proof" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{payment.orderId?.title || 'Order'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Seller: {payment.sellerId?.name || '—'} &middot; {payment.method} &middot; {formatDate(payment.createdAt)}
                  </p>
                  {payment.status === 'rejected' && payment.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1.5">Reason: {payment.rejectionReason}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-navy-600 text-sm mb-1.5">${payment.amount?.toLocaleString()}</p>
                  <StatusBadge status={payment.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Payment Proof</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Order *</Label>
              <Select value={form.orderId} onValueChange={handleOrderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o._id} value={o._id}>{o.title} — ${o.totalAmount?.toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount Paid (USD) *</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm((p) => ({ ...p, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                  <SelectItem value="Western Union">Western Union</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Screenshot *</Label>
              {form.screenshotUrl ? (
                <div className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                  <Image src={form.screenshotUrl} alt="Screenshot" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, screenshotUrl: '' }))}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-navy-400 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-navy-400" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Reference number, bank name, etc."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={submitting || uploading}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
