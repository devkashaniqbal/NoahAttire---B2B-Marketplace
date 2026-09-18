'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Package, Clock, Factory, CheckCircle2, Truck, Ban, ArrowRight,
  MessageSquarePlus, ChevronDown, ChevronUp, RefreshCw, FileDown, Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:        { label: 'Pending',        color: 'bg-amber-100 text-amber-700',  icon: Clock },
  'in-production':{ label: 'In Production',  color: 'bg-alibaba-100 text-alibaba-700',    icon: Factory },
  ready:          { label: 'Ready',          color: 'bg-purple-100 text-purple-700',icon: Package },
  shipped:        { label: 'Shipped',        color: 'bg-indigo-100 text-indigo-700',icon: Truck },
  delivered:      { label: 'Delivered',      color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  cancelled:      { label: 'Cancelled',      color: 'bg-gray-100 text-gray-500',    icon: Ban },
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

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/mine');
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    try {
      await api.patch(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleRequestCancel = async (id) => {
    try {
      await api.patch(`/orders/${id}/request-cancel`);
      toast.success('Cancellation request sent to supplier for approval');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request cancellation');
    }
  };

  const handleReorder = async (id) => {
    try {
      await api.post(`/orders/${id}/reorder`);
      toast.success('Reorder placed successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reorder');
    }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      const { data } = await api.get(`/orders/${order._id}/invoice`);
      const res = await api.get(`/orders/invoices/${data.invoice._id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.invoice.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invoice not available yet');
    }
  };

  const submitReturn = async () => {
    if (!returnReason.trim()) return toast.error('Please provide a reason');
    setSubmittingReturn(true);
    try {
      await api.post('/returns', { orderId: returnOrder._id, requestType: 'refund', reason: returnReason });
      toast.success('Return/refund request submitted');
      setReturnOrder(null);
      setReturnReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const toggleExpanded = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-navy-200 text-sm mt-1">Track production and delivery of your placed orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Browse products and place your first order</p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/products">Browse Products <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const pct = order.quantity > 0 ? Math.min(100, Math.round((order.unitsCompleted / order.quantity) * 100)) : 0;
              const hasUpdates = order.updates?.length > 0;
              const isOpen = !!expanded[order._id];

              return (
                <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      {order.productId?.images?.[0] ? (
                        <Image src={order.productId.images[0]} alt={order.title} fill className="object-contain p-1.5" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-7 w-7 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Qty: {order.quantity} &middot; Seller: {order.sellerId?.name || '—'} &middot; {formatDate(order.createdAt)}
                      </p>
                      {order.expectedDeliveryDate && (
                        <p className="text-xs text-gray-400 mt-0.5">Expected delivery: {formatDate(order.expectedDeliveryDate)}</p>
                      )}
                      {order.trackingNumber && (
                        <p className="text-xs text-indigo-600 mt-0.5 font-medium flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {order.carrier ? `${order.carrier} — ` : ''}{order.trackingNumber}
                        </p>
                      )}
                      {order.cancelRequest?.status === 'pending' && (
                        <p className="text-xs text-amber-600 mt-0.5 font-medium">Cancellation request pending supplier approval</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-navy-600 text-sm mb-1.5">${order.totalAmount?.toLocaleString()}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 border-t border-gray-100 pt-3">
                    {order.status === 'pending' && (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleCancel(order._id)}>
                        Cancel
                      </Button>
                    )}
                    {['in-production', 'ready'].includes(order.status) && order.cancelRequest?.status !== 'pending' && (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleRequestCancel(order._id)}>
                        Request Cancellation
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleReorder(order._id)}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reorder
                    </Button>
                    {order.status === 'delivered' && (
                      <Button variant="ghost" size="sm" onClick={() => setReturnOrder(order)}>
                        <Undo2 className="h-3.5 w-3.5 mr-1" /> Return / Refund
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(order)}>
                      <FileDown className="h-3.5 w-3.5 mr-1" /> Invoice
                    </Button>
                  </div>

                  {/* Units completed progress */}
                  {order.unitsCompleted > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Production progress</span>
                        <span className="text-xs font-semibold text-gray-700">{order.unitsCompleted} / {order.quantity} units ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-alibaba-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Seller updates timeline */}
                  {hasUpdates && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleExpanded(order._id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:underline"
                      >
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                        {order.updates.length} update{order.updates.length > 1 ? 's' : ''} from seller
                        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {isOpen && (
                        <div className="mt-2 space-y-2 border-l-2 border-gray-100 pl-3">
                          {order.updates.slice().reverse().map((u, i) => (
                            <div key={i}>
                              {u.message && <p className="text-sm text-gray-700">{u.message}</p>}
                              {u.unitsCompleted != null && (
                                <p className="text-xs text-gray-500">{u.unitsCompleted} / {order.quantity} units completed</p>
                              )}
                              <p className="text-[10px] text-gray-400">{formatDate(u.postedAt)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!returnOrder} onOpenChange={(o) => !o && setReturnOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Return / Refund</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500 mb-3">{returnOrder?.title}</p>
          <Textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Reason for return/refund..." />
          <DialogFooter>
            <Button onClick={submitReturn} disabled={submittingReturn}>{submittingReturn ? 'Submitting...' : 'Submit Request'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
