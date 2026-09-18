'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, Clock, Factory, CheckCircle2, Truck, Ban, Loader2, MessageSquarePlus } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:        { label: 'Pending',        color: 'bg-amber-100 text-amber-700',  icon: Clock },
  'in-production':{ label: 'In Production',  color: 'bg-alibaba-100 text-alibaba-700',    icon: Factory },
  ready:          { label: 'Ready',          color: 'bg-purple-100 text-purple-700',icon: Package },
  shipped:        { label: 'Shipped',        color: 'bg-indigo-100 text-indigo-700',icon: Truck },
  delivered:      { label: 'Delivered',      color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  cancelled:      { label: 'Cancelled',      color: 'bg-gray-100 text-gray-500',    icon: Ban },
};

const STAGE_LABELS = { cutting: 'Cutting', stitching: 'Stitching', packing: 'Packing', done: 'Done' };

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

const NEXT_STATUS = {
  pending: 'in-production',
  'in-production': 'ready',
  ready: 'shipped',
  shipped: 'delivered',
};

const NEXT_STAGE = { cutting: 'stitching', stitching: 'packing', packing: 'done' };

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateOrder, setUpdateOrder] = useState(null);
  const [updateForm, setUpdateForm] = useState({ message: '', unitsCompleted: '' });
  const [posting, setPosting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/seller', { params: statusFilter !== 'all' ? { status: statusFilter } : {} });
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const patchOrder = async (id, payload) => {
    setUpdatingId(id);
    try {
      await api.patch(`/orders/${id}/stage`, payload);
      toast.success('Order updated');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const advanceStage = (order) => {
    const next = NEXT_STAGE[order.productionStage];
    if (next) patchOrder(order._id, { productionStage: next });
  };

  const advanceStatus = (order) => {
    const next = NEXT_STATUS[order.status];
    if (next) patchOrder(order._id, { status: next });
  };

  const openUpdateDialog = (order) => {
    setUpdateOrder(order);
    setUpdateForm({ message: '', unitsCompleted: order.unitsCompleted || '' });
  };

  const postUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.message.trim() && updateForm.unitsCompleted === '') {
      toast.error('Add a message or units completed');
      return;
    }
    setPosting(true);
    try {
      await api.post(`/orders/${updateOrder._id}/updates`, updateForm);
      toast.success('Update posted to buyer');
      setUpdateOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post update');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage production and delivery of your orders</p>
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
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders placed by buyers will show up here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const pct = order.quantity > 0 ? Math.min(100, Math.round((order.unitsCompleted / order.quantity) * 100)) : 0;
            const lastUpdate = order.updates?.[order.updates.length - 1];
            const canPostUpdate = !['delivered', 'cancelled'].includes(order.status);

            return (
              <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
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
                      Qty: {order.quantity} &middot; Buyer: {order.buyerId?.name || '—'} &middot; {formatDate(order.createdAt)}
                    </p>
                    {order.status === 'in-production' && (
                      <p className="text-xs text-alibaba-600 mt-0.5 font-medium">Stage: {STAGE_LABELS[order.productionStage]}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-navy-600 text-sm mb-1.5">${order.totalAmount?.toLocaleString()}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                {/* Units completed progress */}
                {order.unitsCompleted > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Units completed</span>
                      <span className="text-xs font-semibold text-gray-700">{order.unitsCompleted} / {order.quantity} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-alibaba-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {/* Latest update preview */}
                {lastUpdate?.message && (
                  <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-2">
                    <MessageSquarePlus className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-700">{lastUpdate.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(lastUpdate.postedAt)}</p>
                    </div>
                  </div>
                )}

                {(canPostUpdate || (!['delivered', 'cancelled'].includes(order.status))) && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    {order.status === 'in-production' && order.productionStage !== 'done' && (
                      <Button
                        size="sm" variant="outline"
                        disabled={updatingId === order._id}
                        onClick={() => advanceStage(order)}
                      >
                        {updatingId === order._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Advance to {STAGE_LABELS[NEXT_STAGE[order.productionStage]]}
                      </Button>
                    )}
                    {(order.status !== 'in-production' || order.productionStage === 'done') && NEXT_STATUS[order.status] && (
                      <Button
                        size="sm" variant="primary"
                        disabled={updatingId === order._id}
                        onClick={() => advanceStatus(order)}
                      >
                        {updatingId === order._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Mark as {STATUS_CONFIG[NEXT_STATUS[order.status]].label}
                      </Button>
                    )}
                    {canPostUpdate && (
                      <Button size="sm" variant="outline" onClick={() => openUpdateDialog(order)}>
                        <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                        Post Update
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post Update Dialog */}
      <Dialog open={!!updateOrder} onOpenChange={(open) => !open && setUpdateOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post Update — {updateOrder?.title}</DialogTitle>
          </DialogHeader>

          {updateOrder?.updates?.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50">
              {updateOrder.updates.slice().reverse().map((u, i) => (
                <div key={i} className="text-xs">
                  <p className="text-gray-700">{u.message}{u.unitsCompleted != null && (
                    <span className="text-gray-400"> — {u.unitsCompleted} units completed</span>
                  )}</p>
                  <p className="text-[10px] text-gray-400">{formatDate(u.postedAt)}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={postUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Update Message</Label>
              <Textarea
                placeholder="e.g. Cutting completed, moving to stitching stage"
                value={updateForm.message}
                onChange={(e) => setUpdateForm((p) => ({ ...p, message: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Units Completed</Label>
              <Input
                type="number"
                min="0"
                max={updateOrder?.quantity}
                placeholder={`out of ${updateOrder?.quantity || 0}`}
                value={updateForm.unitsCompleted}
                onChange={(e) => setUpdateForm((p) => ({ ...p, unitsCompleted: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpdateOrder(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={posting}>
                {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Post Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
