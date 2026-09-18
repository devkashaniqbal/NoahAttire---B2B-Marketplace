'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import RevenueProfitChart from '@/components/shared/RevenueProfitChart';
import { ShoppingBag, DollarSign, TrendingUp, FileText, Loader2 } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, href }) {
  const colors = {
    blue:   { bg: 'bg-alibaba-50',   text: 'text-alibaba-600' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600' },
    orange: { bg: 'bg-alibaba-50', text: 'text-alibaba-600' },
  }[color] || {};

  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors.bg)}>
        <Icon className={cn('h-5 w-5', colors.text)} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export default function SellerAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/seller/analytics')
      .then((res) => setAnalytics(res.data.analytics))
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

  const statusEntries = Object.entries(analytics?.ordersByStatus || {});
  const maxStatusCount = Math.max(...statusEntries.map(([, v]) => v), 1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-600">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Your sales performance and order trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={analytics?.totalOrders ?? 0} icon={ShoppingBag} color="blue" href="/seller/orders" />
        <StatCard label="Total Revenue" value={`$${(analytics?.revenue ?? 0).toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard label="Total Profit" value={`$${(analytics?.profit ?? 0).toLocaleString()}`} icon={TrendingUp} color="amber" />
        <StatCard label="Pending Quote Requests" value={analytics?.pendingRfqs ?? 0} icon={FileText} color="orange" href="/seller/rfqs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Revenue vs Profit (Last 30 Days)</h3>
          <RevenueProfitChart data={analytics?.revenueTrend || []} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Orders by Status</h3>
          {statusEntries.length > 0 ? (
            <div className="space-y-4">
              {statusEntries.map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 font-medium capitalize">{status.replace('-', ' ')}</span>
                    <span className="text-xs font-bold text-gray-800">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-alibaba-500" style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No orders yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
        </div>
        {analytics?.topProducts?.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {analytics.topProducts.map((p, i) => (
              <div key={p._id} className="px-6 py-3 flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-navy-50 text-navy-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.totalQty} units sold</p>
                </div>
                <span className="text-sm font-semibold text-navy-600">${p.totalRevenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-400">No sales data yet</div>
        )}
      </div>
    </div>
  );
}
