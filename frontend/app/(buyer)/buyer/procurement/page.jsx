'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { ShoppingCart, Plus, Clock, CheckCircle2, XCircle, RefreshCw, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  'pending-approval': { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved:           { label: 'Approved',          color: 'bg-alibaba-100 text-alibaba-700',   icon: CheckCircle2 },
  rejected:           { label: 'Rejected',           color: 'bg-red-100 text-red-700',     icon: XCircle },
  converted:          { label: 'Converted to Order', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['pending-approval'];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function ProcurementPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productId: '', quantity: '', budgetLimit: '', justification: '', isRecurring: false, recurringIntervalDays: '30',
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/mine');
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) {
      return toast.error('Product ID and quantity are required');
    }
    setSubmitting(true);
    try {
      await api.post('/procurement', {
        productId: form.productId,
        quantity: Number(form.quantity),
        budgetLimit: form.budgetLimit ? Number(form.budgetLimit) : undefined,
        justification: form.justification,
        isRecurring: form.isRecurring,
        recurringIntervalDays: Number(form.recurringIntervalDays),
      });
      toast.success('Purchase request submitted for approval');
      setOpen(false);
      setForm({ productId: '', quantity: '', budgetLimit: '', justification: '', isRecurring: false, recurringIntervalDays: '30' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/procurement/${id}/action`, { action });
      toast.success(action === 'approve' ? 'Approved and converted to order' : 'Request rejected');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Procurement Center</h1>
            <p className="text-navy-200 text-sm mt-1">Submit purchase requests, set budgets, and track approvals</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg"><Plus className="mr-2 h-4 w-4" /> New Purchase Request</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Purchase Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Product ID</Label>
                  <Input value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="Paste product ID" />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <Label>Budget Limit (optional)</Label>
                  <Input type="number" min="0" value={form.budgetLimit} onChange={(e) => setForm({ ...form, budgetLimit: e.target.value })} placeholder="Max amount you're willing to spend" />
                </div>
                <div>
                  <Label>Justification</Label>
                  <Textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} placeholder="Why is this purchase needed?" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
                  <Label htmlFor="recurring" className="!mb-0">Make this a recurring order</Label>
                </div>
                {form.isRecurring && (
                  <div>
                    <Label>Repeat every (days)</Label>
                    <Input type="number" min="1" value={form.recurringIntervalDays} onChange={(e) => setForm({ ...form, recurringIntervalDays: e.target.value })} />
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No purchase requests yet</p>
            <p className="text-sm text-gray-400 mt-1">Submit a request to start the approval workflow</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty: {r.quantity} &middot; Seller: {r.sellerId?.name || '—'} &middot; {formatDate(r.createdAt)}
                    </p>
                    {r.justification && <p className="text-sm text-gray-600 mt-2">{r.justification}</p>}
                    {r.isRecurring && (
                      <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Recurring every {r.recurringIntervalDays} days
                      </p>
                    )}
                    {r.budgetLimit && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Budget limit: ${r.budgetLimit.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-2">
                    <p className="font-bold text-navy-600 text-sm">${r.estimatedCost?.toLocaleString()}</p>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                {r.status === 'pending-approval' && (
                  <div className="flex gap-2 mt-4 border-t border-gray-100 pt-3">
                    <Button size="sm" onClick={() => handleAction(r._id, 'approve')}>Approve & Convert to Order</Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleAction(r._id, 'reject')}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
