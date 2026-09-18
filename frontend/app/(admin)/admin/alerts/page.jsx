'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Loader2, AlertTriangle, PackageX, Truck, Factory, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_CONFIG = {
  'low-stock': { label: 'Low Stock', icon: PackageX, bg: 'bg-amber-100 text-amber-700' },
  reorder: { label: 'Reorder Needed', icon: RefreshCw, bg: 'bg-amber-100 text-amber-700' },
  'late-order': { label: 'Late Delivery', icon: Truck, bg: 'bg-red-100 text-red-700' },
  'production-delay': { label: 'Production Delay', icon: Factory, bg: 'bg-red-100 text-red-700' },
  'payment-pending': { label: 'Payment Pending', icon: CreditCard, bg: 'bg-alibaba-100 text-alibaba-700' },
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/alerts');
      setAlerts(res.data.alerts || []);
      setCounts(res.data.counts || {});
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">Live alerts computed from stock, orders & payments</p>
        </div>
        <Button variant="outline" onClick={fetchAlerts}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-amber-600">{counts.lowStock || 0}</p>
          <p className="text-xs text-gray-500">Low Stock Items</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-red-600">{counts.lateOrders || 0}</p>
          <p className="text-xs text-gray-500">Late Orders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-red-600">{counts.productionDelays || 0}</p>
          <p className="text-xs text-gray-500">Production Delays</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-alibaba-600">{counts.pendingPayments || 0}</p>
          <p className="text-xs text-gray-500">Pending Payments</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No active alerts — everything looks good</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((alert, i) => {
              const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG['low-stock'];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg)}>{cfg.label}</span>
                      {alert.severity === 'critical' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">Critical</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(alert.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
