'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Truck, Package, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  ready:     { label: 'Ready to Ship', color: 'bg-purple-100 text-purple-700' },
  shipped:   { label: 'Shipped',       color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered',     color: 'bg-green-100 text-green-700' },
};

export default function SellerShipmentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [form, setForm] = useState({ trackingNumber: '', carrier: '' });
  const [submitting, setSubmitting] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ['ready', 'shipped', 'delivered'].map((status) => api.get('/orders/seller', { params: { status, limit: 50 } }))
      );
      const all = results.flatMap((r) => r.data.orders || []);
      const filtered = statusFilter === 'all' ? all : all.filter((o) => o.status === statusFilter);
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(filtered);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openTracking = (order) => {
    setTrackingOrder(order);
    setForm({ trackingNumber: order.trackingNumber || '', carrier: order.carrier || '' });
  };

  const submitTracking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/orders/${trackingOrder._id}/tracking`, form);
      toast.success('Tracking info saved');
      setTrackingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tracking');
    } finally {
      setSubmitting(false);
    }
  };

  const markDelivered = async (order) => {
    setMarkingId(order._id);
    try {
      await api.patch(`/orders/${order._id}/stage`, { status: 'delivered' });
      toast.success('Marked as delivered');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Shipments &amp; Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">Manage tracking numbers and delivery status</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ready">Ready to Ship</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Truck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No shipments yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders marked Ready, Shipped, or Delivered will show up here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
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
                  {order.shippingAddress && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {order.shippingAddress}
                    </p>
                  )}
                  {order.trackingNumber && (
                    <p className="text-xs text-indigo-600 mt-1 font-medium">
                      {order.carrier ? `${order.carrier} — ` : ''}{order.trackingNumber}
                    </p>
                  )}
                </div>
                <span className={cn('flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full', STATUS_CONFIG[order.status]?.color)}>
                  {STATUS_CONFIG[order.status]?.label || order.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button size="sm" variant="outline" onClick={() => openTracking(order)}>
                  <Truck className="mr-1.5 h-3.5 w-3.5" />
                  {order.trackingNumber ? 'Update Tracking' : 'Add Tracking'}
                </Button>
                {order.status === 'shipped' && (
                  <Button size="sm" variant="primary" disabled={markingId === order._id} onClick={() => markDelivered(order)}>
                    {markingId === order._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                    Mark as Delivered
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tracking — {trackingOrder?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitTracking} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tracking Number</Label>
              <Input
                value={form.trackingNumber}
                onChange={(e) => setForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                placeholder="Leave blank to auto-generate"
              />
              <p className="text-xs text-gray-400">A tracking ID will be auto-generated if left blank</p>
            </div>
            <div className="space-y-1.5">
              <Label>Carrier</Label>
              <Input
                value={form.carrier}
                onChange={(e) => setForm((p) => ({ ...p, carrier: e.target.value }))}
                placeholder="e.g. DHL, FedEx, Local Courier"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTrackingOrder(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
