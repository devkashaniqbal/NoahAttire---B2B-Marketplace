'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, FileText, Download, MessageCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/invoices', { params: { page, limit: 20 } });
      setInvoices(res.data.invoices || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(1); }, []);

  const whatsappLink = (invoice) => {
    const text = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber} for "${invoice.orderId?.title || 'order'}" — Total: $${invoice.total.toFixed(2)}.${invoice.pdfUrl ? ` View/download: ${invoice.pdfUrl}` : ''}`
    );
    return `https://wa.me/?text=${text}`;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-500 text-sm mt-1">{pagination.total} invoices generated. Generate new invoices from an order's detail panel in Order Management.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No invoices generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-[180px] truncate">{inv.orderId?.title || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-700">{inv.buyerId?.name || '—'}</td>
                    <td className="px-5 py-3.5 font-medium text-navy-600">${inv.total.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(inv.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a href={`${API_BASE}/admin/invoices/${inv._id}/pdf`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Download className="h-3 w-3 mr-1" />PDF
                          </Button>
                        </a>
                        <a href={whatsappLink(inv)} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50">
                            <MessageCircle className="h-3 w-3 mr-1" />Share
                          </Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
            {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => fetchInvoices(p)}
                className={cn('w-8 h-8 rounded text-sm font-medium transition-colors',
                  pagination.page === p ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
