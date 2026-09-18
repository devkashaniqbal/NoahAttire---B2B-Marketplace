'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import OrdersDonutChart from '@/components/shared/OrdersDonutChart';
import RevenueProfitChart from '@/components/shared/RevenueProfitChart';
import {
  ShoppingBag, DollarSign, TrendingUp, TrendingDown, Boxes, Clock,
  Scissors, Shirt, PackageCheck, AlertTriangle, ArrowRight,
  Package, CheckCircle2, Truck, Factory, Loader2, Bell,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    blue:   { bg: 'bg-alibaba-50',   text: 'text-alibaba-600' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600' },
  }[color] || {};

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors.bg)}>
        <Icon className={cn('h-5 w-5', colors.text)} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ label, value, total, color, icon: Icon }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-gray-400" /> {label}
        </span>
        <span className="text-xs font-bold text-gray-800">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const TIMELINE_STEPS = [
  { key: 'orderReceivedAt',     label: 'Order Received' },
  { key: 'productionStartedAt', label: 'Production Start' },
  { key: 'expectedDeliveryDate',label: 'Expected Delivery' },
  { key: 'deliveredAt',         label: 'Delivered' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  const ordersOverview = stats?.ordersOverview || {};
  const totalActiveOrders = Object.entries(ordersOverview)
    .filter(([k]) => k !== 'cancelled')
    .reduce((sum, [, v]) => sum + v, 0);

  const totalProductionOrders = Object.values(stats?.productionProgress || {}).reduce((a, b) => a + b, 0);

  const timeline = stats?.orderTimeline;
  const timelineCompletedCount = timeline
    ? TIMELINE_STEPS.filter((s) => timeline[s.key]).length
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Production &amp; order overview</p>
      </div>

      {/* Pending-approval alert */}
      {stats?.sellers?.pending > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {stats.sellers.pending} seller{stats.sellers.pending > 1 ? 's' : ''} waiting for approval
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Review and approve seller registrations to let them list products</p>
            </div>
          </div>
          <Link href="/admin/sellers?tab=pending"
            className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors">
            Review Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingBag} color="blue" />
        <StatCard
          label="Production Expenses"
          value={`$${(stats?.productionExpenses ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="amber"
          sub={`This month · $${(stats?.today?.expenses ?? 0).toLocaleString()} today`}
        />
        <StatCard
          label="Profit / Loss"
          value={`${stats?.profitLoss >= 0 ? '+' : ''}$${(stats?.profitLoss ?? 0).toLocaleString()}`}
          icon={stats?.profitLoss >= 0 ? TrendingUp : TrendingDown}
          color={stats?.profitLoss >= 0 ? 'green' : 'red'}
          sub={`This month · ${stats?.today?.profitLoss >= 0 ? '+' : ''}$${(stats?.today?.profitLoss ?? 0).toLocaleString()} today`}
        />
        <StatCard label="Available Stock" value={(stats?.availableStock ?? 0).toLocaleString()} icon={Boxes} color="purple" sub="Units" />
        <StatCard label="Pending Orders" value={stats?.pendingOrders ?? 0} icon={Clock} color="red" />
      </div>

      {/* Orders Overview / Production Progress / Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Orders Overview</h3>
          <OrdersDonutChart overview={ordersOverview} total={totalActiveOrders} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Production Progress</h3>
          <div className="space-y-4">
            <ProgressBar label="Cutting Stage" value={stats?.productionProgress?.cutting || 0} total={totalProductionOrders} color="bg-alibaba-500" icon={Scissors} />
            <ProgressBar label="Stitching" value={stats?.productionProgress?.stitching || 0} total={totalProductionOrders} color="bg-purple-500" icon={Shirt} />
            <ProgressBar label="Packing" value={stats?.productionProgress?.packing || 0} total={totalProductionOrders} color="bg-green-500" icon={PackageCheck} />
          </div>
          {totalProductionOrders === 0 && (
            <p className="text-xs text-gray-400 mt-4">No orders currently in production</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Low Stock Alerts</h3>
            <Link href="/admin/products" className="text-xs text-navy-600 hover:underline">View all</Link>
          </div>
          {stats?.lowStockAlerts?.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockAlerts.map((p) => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="relative w-9 h-9 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.title} fill className="object-contain p-1" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                    <p className="text-xs text-red-500">{p.stock} left (threshold {p.lowStockThreshold})</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">All stock levels healthy</div>
          )}
        </div>
      </div>

      {/* Revenue vs Profit / Top Selling / Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Revenue vs Profit (Last 7 Days)</h3>
          <RevenueProfitChart data={stats?.revenueVsProfit || []} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Top Selling Products</h3>
            {stats?.topSellingProducts?.length > 0 ? (
              <div className="space-y-3">
                {stats.topSellingProducts.map((p) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <div className="relative w-9 h-9 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                      {p.image ? (
                        <Image src={p.image} alt={p.title} fill className="object-contain p-1" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.totalQty} units sold</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {stats?.recentOrders?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentOrders.map((o) => (
              <div key={o._id} className="px-6 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-navy-700 text-xs font-bold">{o.buyerId?.name?.charAt(0).toUpperCase() || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {o.title}
                    <span className="text-gray-400 font-normal"> · {o.buyerId?.name || 'Unknown buyer'}</span>
                  </p>
                  <p className="text-xs text-gray-400">Seller: {o.sellerId?.name || '—'} · {formatDate(o.createdAt)}</p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold text-navy-600">${o.totalAmount?.toLocaleString()}</span>
                <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {o.status.replace('-', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Timeline / Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-6">Order Timeline Overview</h3>
          {timeline ? (
            <div className="flex items-center justify-between">
              {TIMELINE_STEPS.map((step, i) => {
                const done = !!timeline[step.key];
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center text-center relative">
                    {i > 0 && (
                      <div className={cn(
                        'absolute top-3.5 right-1/2 w-full h-0.5 -z-10',
                        done ? 'bg-green-400' : 'bg-gray-200'
                      )} />
                    )}
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center mb-2 z-10',
                      done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    )}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <p className="text-xs font-medium text-gray-700">{step.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeline[step.key] ? formatDate(timeline[step.key]) : 'Pending'}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No active production orders right now</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Alerts</h3>
          {stats?.recentAlerts?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAlerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    a.type === 'low-stock' ? 'bg-red-50' : 'bg-amber-50'
                  )}>
                    <Bell className={cn('h-3.5 w-3.5', a.type === 'low-stock' ? 'text-red-500' : 'text-amber-500')} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-700">{a.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(a.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No alerts</p>
          )}
        </div>
      </div>
    </div>
  );
}
