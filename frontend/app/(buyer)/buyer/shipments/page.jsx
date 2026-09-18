'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Truck, Package, MapPin, FileCheck } from 'lucide-react';

export default function ShipmentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/mine?limit=100');
      const shipping = (res.data.orders || []).filter((o) => ['ready', 'shipped', 'delivered'].includes(o.status));
      setOrders(shipping);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold">Shipment & Tracking</h1>
          <p className="text-navy-200 text-sm mt-1">Track your shipped and delivered orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-28" />)}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Truck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No shipments to track yet</p>
            <p className="text-sm text-gray-400 mt-1">Shipments appear here once an order is ready or shipped</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const steps = ['ready', 'shipped', 'delivered'];
              const currentIdx = steps.indexOf(o.status);
              return (
                <div key={o._id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      {o.productId?.images?.[0] ? (
                        <Image src={o.productId.images[0]} alt={o.title} fill className="object-contain p-1" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{o.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {o.quantity} &middot; {formatDate(o.createdAt)}</p>
                    </div>
                  </div>

                  {o.trackingNumber && (
                    <div className="bg-indigo-50 rounded-lg p-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-indigo-700">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">{o.carrier || 'Carrier'}</span>
                        <span className="font-mono">{o.trackingNumber}</span>
                      </div>
                    </div>
                  )}

                  {/* Tracking timeline */}
                  <div className="flex items-center mb-2">
                    {steps.map((s, i) => (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                          i <= currentIdx ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-400'
                        )}>
                          {s === 'ready' && <Package className="h-3.5 w-3.5" />}
                          {s === 'shipped' && <Truck className="h-3.5 w-3.5" />}
                          {s === 'delivered' && <MapPin className="h-3.5 w-3.5" />}
                        </div>
                        {i < steps.length - 1 && <div className={cn('flex-1 h-1 mx-1', i < currentIdx ? 'bg-navy-600' : 'bg-gray-100')} />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mb-3">
                    {steps.map((s) => <span key={s} className="text-[10px] text-gray-400 capitalize">{s}</span>)}
                  </div>

                  {o.deliveryProof && (
                    <a href={o.deliveryProof} target="_blank" rel="noopener noreferrer" className="text-xs text-navy-600 hover:underline flex items-center gap-1">
                      <FileCheck className="h-3.5 w-3.5" /> View delivery proof
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
