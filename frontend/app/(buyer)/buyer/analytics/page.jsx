'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { BarChart3, DollarSign, Package, TrendingUp, Building2 } from 'lucide-react';

export default function BuyerAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/mine/analytics')
      .then((res) => setAnalytics(res.data.analytics))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  const statusEntries = analytics ? Object.entries(analytics.ordersByStatus || {}) : [];
  const maxTrend = analytics?.spendTrend?.length
    ? Math.max(...analytics.spendTrend.map((d) => d.spend), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-navy-200 text-sm mt-1">Your spending patterns and supplier breakdown</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Orders', value: analytics?.totalOrders ?? '—', icon: Package, color: 'text-navy-600', bg: 'bg-navy-50' },
            { label: 'Total Spend', value: `$${(analytics?.totalSpend ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Top Suppliers', value: analytics?.topSellers?.length ?? '—', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spend trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Spend Trend (30 days)</h2>
            {!loading && analytics?.spendTrend?.length ? (
              <div className="flex items-end gap-1 h-40">
                {analytics.spendTrend.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="w-full bg-navy-500 rounded-t" style={{ height: `${Math.max(4, (d.spend / maxTrend) * 100)}%` }} />
                    <span className="absolute -top-5 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100">${d.spend.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">No spend data yet</p>
            )}
          </div>

          {/* Orders by status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Orders by Status</h2>
            {!loading && statusEntries.length ? (
              <div className="space-y-3">
                {statusEntries.map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600">{status}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-navy-500 rounded-full" style={{ width: `${(count / (analytics.totalOrders || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">No order data yet</p>
            )}
          </div>
        </div>

        {/* Top sellers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Top Suppliers by Spend</h2>
          {!loading && analytics?.topSellers?.length ? (
            <div className="space-y-2">
              {analytics.topSellers.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{s.sellerName}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-navy-600">${s.totalSpend.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-2">{s.totalOrders} orders</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No supplier data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
