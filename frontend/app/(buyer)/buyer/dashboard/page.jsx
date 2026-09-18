'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import {
  Package, Clock, Factory, Truck, CheckCircle2, DollarSign, Bell,
  Heart, ArrowRight, ChevronRight, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  pending:        { label: 'Pending',        color: 'bg-amber-100 text-amber-700',  icon: Clock },
  'in-production':{ label: 'In Production',  color: 'bg-alibaba-100 text-alibaba-700',    icon: Factory },
  ready:          { label: 'Ready',          color: 'bg-purple-100 text-purple-700',icon: Package },
  shipped:        { label: 'Shipped',        color: 'bg-indigo-100 text-indigo-700',icon: Truck },
  delivered:      { label: 'Delivered',      color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  cancelled:      { label: 'Cancelled',      color: 'bg-gray-100 text-gray-500',    icon: Clock },
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

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders/mine?limit=100').catch(() => ({ data: { orders: [] } })),
      api.get('/auth/me/saved-products').catch(() => ({ data: { products: [] } })),
    ]).then(([ordersRes, savedRes]) => {
      setOrders(ordersRes.data.orders || []);
      setSavedProducts(savedRes.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalSpend = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'in-production').length;
  const inTransitCount = orders.filter((o) => ['ready', 'shipped'].includes(o.status)).length;
  const completedCount = orders.filter((o) => o.status === 'delivered').length;

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-navy-600', bg: 'bg-navy-50' },
    { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Transit', value: inTransitCount, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Saved Products', value: savedProducts.length, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-navy-200 text-sm mb-1">Welcome back</p>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-navy-200 text-sm mt-0.5">{user?.email}</p>
            </div>
            <Button variant="gold" size="lg" asChild>
              <Link href="/products">
                <Package className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
              <p className="text-xl font-bold text-gray-900">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent orders + timeline — 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <Link href="/buyer/orders" className="text-sm text-navy-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-20" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No orders yet</p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href="/products">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    href="/buyer/orders"
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-navy-200 transition-colors"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      {order.productId?.images?.[0] ? (
                        <Image src={order.productId.images[0]} alt={order.title} fill className="object-contain p-1" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {order.quantity} &middot; {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-navy-600 text-sm mb-1.5">${order.totalAmount?.toLocaleString()}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Order status timeline (most recent active order) */}
            {!loading && recentOrders.some((o) => o.status === 'in-production') && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Order Status Timeline</h3>
                {(() => {
                  const active = recentOrders.find((o) => o.status === 'in-production') || recentOrders[0];
                  const steps = ['pending', 'in-production', 'ready', 'shipped', 'delivered'];
                  const currentIdx = steps.indexOf(active.status);
                  return (
                    <div>
                      <p className="text-xs text-gray-500 mb-3">{active.title}</p>
                      <div className="flex items-center">
                        {steps.map((s, i) => (
                          <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                              i <= currentIdx ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-400'
                            )}>
                              {i + 1}
                            </div>
                            {i < steps.length - 1 && (
                              <div className={cn('flex-1 h-1 mx-1', i < currentIdx ? 'bg-navy-600' : 'bg-gray-100')} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        {steps.map((s) => (
                          <span key={s} className="text-[10px] text-gray-400 capitalize">{s}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Notifications
              </p>
              {pendingCount > 0 ? (
                <p className="text-sm text-gray-600">You have {pendingCount} order{pendingCount > 1 ? 's' : ''} in progress.</p>
              ) : (
                <p className="text-sm text-gray-400">No new notifications</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saved Products</p>
                <Link href="/products" className="text-xs text-navy-600 hover:underline">Browse</Link>
              </div>
              {savedProducts.length === 0 ? (
                <p className="text-sm text-gray-400">No saved products yet</p>
              ) : (
                <div className="space-y-2">
                  {savedProducts.slice(0, 4).map((p) => (
                    <Link key={p._id} href={`/products/${p._id}`} className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 -m-1.5">
                      <div className="relative w-8 h-8 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
                        {p.images?.[0] && <Image src={p.images[0]} alt={p.title} fill className="object-contain p-0.5" />}
                      </div>
                      <p className="text-xs text-gray-700 truncate">{p.title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: 'Reorder a Past Order', href: '/buyer/orders', icon: RefreshCw },
                  { label: 'Quote Requests',        href: '/buyer/rfqs' },
                  { label: 'Procurement Center',    href: '/buyer/procurement' },
                  { label: 'Supplier Management',   href: '/buyer/suppliers' },
                  { label: 'Support Center',        href: '/buyer/support' },
                  { label: 'Analytics',             href: '/buyer/analytics' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between text-sm text-gray-600 hover:text-navy-600 py-1.5 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    {label}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
