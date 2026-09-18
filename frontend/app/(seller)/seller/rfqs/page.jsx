'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText, Package, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',  icon: Clock },
  quoted:   { label: 'Quoted',   color: 'bg-alibaba-100 text-alibaba-700',    icon: FileText },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-500',   icon: XCircle },
  expired:  { label: 'Expired',  color: 'bg-gray-100 text-gray-500',   icon: XCircle },
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

export default function SellerRFQsPage() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [quoteRfq, setQuoteRfq] = useState(null);
  const [form, setForm] = useState({ price: '', leadTimeDays: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rfqs/seller', { params: statusFilter !== 'all' ? { status: statusFilter } : {} });
      setRfqs(res.data.rfqs || []);
    } catch {
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

  const openQuote = (rfq) => {
    setQuoteRfq(rfq);
    setForm({ price: rfq.targetPrice || '', leadTimeDays: '', notes: '' });
  };

  const submitQuote = async (e) => {
    e.preventDefault();
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Enter a valid quote price');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/rfqs/${quoteRfq._id}/quote`, form);
      toast.success('Quote sent to buyer');
      setQuoteRfq(null);
      fetchRfqs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Request for Quotations</h1>
          <p className="text-gray-500 text-sm mt-1">Review buyer quote requests and send pricing</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(STATUS_CONFIG).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse" />)}
        </div>
      ) : rfqs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No quote requests yet</p>
          <p className="text-sm text-gray-400 mt-1">Buyer RFQs will show up here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => (
            <div key={rfq._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                  {rfq.productId?.images?.[0] ? (
                    <Image src={rfq.productId.images[0]} alt={rfq.title} fill className="object-contain p-1.5" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-7 w-7 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{rfq.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Qty: {rfq.quantity} &middot; Buyer: {rfq.buyerId?.name || '—'} &middot; {formatDate(rfq.createdAt)}
                  </p>
                  {rfq.targetPrice && (
                    <p className="text-xs text-gray-400 mt-0.5">Target price: ${rfq.targetPrice}/unit</p>
                  )}
                  {rfq.specs && (
                    <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-md px-2.5 py-1.5">{rfq.specs}</p>
                  )}
                  {rfq.status === 'quoted' && (
                    <p className="text-xs text-alibaba-600 mt-1.5 font-medium">
                      Quoted: ${rfq.quote.price}/unit{rfq.quote.leadTimeDays ? ` · ${rfq.quote.leadTimeDays} day lead time` : ''}
                    </p>
                  )}
                </div>
                <StatusBadge status={rfq.status} />
              </div>

              {rfq.status === 'pending' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Button size="sm" variant="primary" onClick={() => openQuote(rfq)}>
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Submit Quote
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!quoteRfq} onOpenChange={(open) => !open && setQuoteRfq(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Quote — {quoteRfq?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitQuote} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Quote Price (per unit, USD) *</Label>
              <Input
                type="number" min="0.01" step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Time (days)</Label>
              <Input
                type="number" min="1"
                value={form.leadTimeDays}
                onChange={(e) => setForm((p) => ({ ...p, leadTimeDays: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Payment terms, bulk discounts, customization notes..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuoteRfq(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Quote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
