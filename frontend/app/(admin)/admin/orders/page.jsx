'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, Package, Loader2, Truck, FileText, MessageCircle, ClipboardList,
} from 'lucide-react';

const STATUSES = ['pending', 'in-production', 'ready', 'shipped', 'delivered', 'cancelled'];
const STAGES = ['cutting', 'stitching', 'packing', 'done'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-gray-100 text-gray-700' },
  'in-production': { label: 'In Production', bg: 'bg-alibaba-100 text-alibaba-700' },
  ready: { label: 'Ready', bg: 'bg-purple-100 text-purple-700' },
  shipped: { label: 'Shipped', bg: 'bg-amber-100 text-amber-700' },
  delivered: { label: 'Delivered', bg: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100 text-red-700' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [unitsCompleted, setUnitsCompleted] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [taxPercent, setTaxPercent] = useState('');

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      const res = await api.get('/admin/orders', { params });
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => { fetchOrders(1); }, [status]);

  const openOrder = (order) => {
    setSelected(order);
    setTrackingNumber(order.trackingNumber || '');
    setCarrier(order.carrier || '');
    setUnitsCompleted('');
    setUpdateMessage('');
    setWhatsappLink('');
  };

  const refreshSelected = async (id) => {
    const res = await api.get(`/admin/orders/${id}`);
    setSelected(res.data.order);
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${selected._id}/status`, { status: newStatus });
      toast.success('Order status updated — buyer notified by email');
      await refreshSelected(selected._id);
      fetchOrders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (newStage) => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${selected._id}/status`, { productionStage: newStage });
      toast.success('Production stage updated');
      await refreshSelected(selected._id);
      fetchOrders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!updateMessage.trim() && unitsCompleted === '') {
      toast.error('Enter a message or units completed');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/admin/orders/${selected._id}/updates`, {
        message: updateMessage,
        unitsCompleted: unitsCompleted || undefined,
      });
      toast.success('Update posted');
      setUpdateMessage('');
      setUnitsCompleted('');
      await refreshSelected(selected._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post update');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Tracking number is required');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${selected._id}/tracking`, { trackingNumber, carrier });
      toast.success('Tracking info saved — buyer notified by email');
      await refreshSelected(selected._id);
      fetchOrders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tracking');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      const res = await api.post(`/admin/invoices/generate/${selected._id}`, { taxPercent: Number(taxPercent) || 0 });
      toast.success('Invoice generated');
      setWhatsappLink(res.data.whatsappShareLink || '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search orders..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders(1)}
              className="pl-9 w-52" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400 text-sm">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer / Seller</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {order.productId?.images?.[0] ? (
                            <Image src={order.productId.images[0]} alt={order.title} width={36} height={36}
                              className="w-9 h-9 rounded-md object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <p className="font-medium text-gray-900 max-w-[180px] truncate">{order.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-800 text-xs"><span className="text-gray-400">Buyer:</span> {order.buyerId?.name || '—'}</p>
                        <p className="text-gray-800 text-xs"><span className="text-gray-400">Seller:</span> {order.sellerId?.name || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{order.quantity}</td>
                      <td className="px-5 py-3.5 font-medium text-navy-600">${order.totalAmount?.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg)}>{cfg.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openOrder(order)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
            {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => fetchOrders(p)}
                className={cn('w-8 h-8 rounded text-sm font-medium transition-colors',
                  pagination.page === p ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><p className="text-gray-400 text-xs">Buyer</p><p className="font-medium">{selected.buyerId?.name}</p></div>
                <div><p className="text-gray-400 text-xs">Seller</p><p className="font-medium">{selected.sellerId?.name}</p></div>
                <div><p className="text-gray-400 text-xs">Quantity</p><p className="font-medium">{selected.quantity}</p></div>
                <div><p className="text-gray-400 text-xs">Total</p><p className="font-medium">${selected.totalAmount?.toLocaleString()}</p></div>
                <div><p className="text-gray-400 text-xs">Units Completed</p><p className="font-medium">{selected.unitsCompleted} / {selected.quantity}</p></div>
                <div><p className="text-gray-400 text-xs">Expected Delivery</p><p className="font-medium">{selected.expectedDeliveryDate ? formatDate(selected.expectedDeliveryDate) : '—'}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Order Status</p>
                  <Select value={selected.status} onValueChange={handleStatusChange} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Production Stage</p>
                  <Select value={selected.productionStage} onValueChange={handleStageChange} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />Tracking Info</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input placeholder="Leave blank to auto-generate" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                  <Input placeholder="Carrier (e.g. DHL)" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
                </div>
                <Button size="sm" onClick={handleSaveTracking} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Save Tracking
                </Button>
                <p className="text-xs text-gray-400 mt-1.5">A tracking ID will be auto-generated if left blank</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Production Update</p>
                <div className="grid grid-cols-[1fr_120px] gap-2 mb-2">
                  <Input placeholder="Update message" value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} />
                  <Input placeholder="Units done" type="number" value={unitsCompleted} onChange={(e) => setUnitsCompleted(e.target.value)} />
                </div>
                <Button size="sm" onClick={handlePostUpdate} disabled={saving}>Post Update</Button>

                {selected.updates?.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                    {selected.updates.slice().reverse().map((u, i) => (
                      <div key={i} className="text-xs text-gray-600 border-l-2 border-gray-200 pl-2">
                        {u.message} {u.unitsCompleted != null && <span className="text-gray-400">({u.unitsCompleted} units)</span>}
                        <span className="text-gray-400 ml-1">— {formatDate(u.postedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Invoice</p>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Tax %"
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-24"
                  />
                  <Button size="sm" variant="outline" onClick={handleGenerateInvoice} disabled={generatingInvoice}>
                    {generatingInvoice && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Generate Invoice
                  </Button>
                  {whatsappLink && (
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />Share via WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
