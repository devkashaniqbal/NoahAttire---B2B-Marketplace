'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Wallet, Clock, CheckCircle2, XCircle, Loader2, ImageIcon } from 'lucide-react';
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

export default function SellerPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rejectPayment, setRejectPayment] = useState(null);
  const [reason, setReason] = useState('');
  const [actingId, setActingId] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/seller', { params: statusFilter !== 'all' ? { status: statusFilter } : {} });
      setPayments(res.data.payments || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const verify = async (payment) => {
    setActingId(payment._id);
    try {
      await api.patch(`/payments/${payment._id}/verify`, { status: 'verified' });
      toast.success('Payment verified');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setActingId(null);
    }
  };

  const submitReject = async (e) => {
    e.preventDefault();
    setActingId(rejectPayment._id);
    try {
      await api.patch(`/payments/${rejectPayment._id}/verify`, { status: 'rejected', rejectionReason: reason });
      toast.success('Payment rejected');
      setRejectPayment(null);
      setReason('');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Payments &amp; Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Review payment proof screenshots submitted by buyers</p>
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
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No payment submissions yet</p>
          <p className="text-sm text-gray-400 mt-1">Buyer payment proofs will show up here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment._id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
              <button
                onClick={() => setPreviewUrl(payment.screenshotUrl)}
                className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-alibaba-400 transition-colors"
              >
                <Image src={payment.screenshotUrl} alt="Payment proof" fill className="object-cover" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{payment.orderId?.title || 'Order'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Buyer: {payment.buyerId?.name || '—'} &middot; {payment.method} &middot; {formatDate(payment.createdAt)}
                </p>
                {payment.notes && <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-md px-2.5 py-1.5">{payment.notes}</p>}
                {payment.status === 'rejected' && payment.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1.5">Rejection reason: {payment.rejectionReason}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-navy-600 text-sm mb-1.5">${payment.amount?.toLocaleString()}</p>
                <StatusBadge status={payment.status} />
                {payment.status === 'pending' && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="primary" disabled={actingId === payment._id} onClick={() => verify(payment)}>
                      {actingId === payment._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Verify'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setRejectPayment(payment)}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot preview */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Payment Screenshot</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
              <Image src={previewUrl} alt="Payment proof" fill className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason */}
      <Dialog open={!!rejectPayment} onOpenChange={(open) => !open && setRejectPayment(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitReject} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                placeholder="e.g. Amount doesn't match, screenshot unclear..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectPayment(null)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={actingId === rejectPayment?._id}>
                {actingId === rejectPayment?._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reject Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
