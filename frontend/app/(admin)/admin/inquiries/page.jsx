'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Inbox, Loader2, ChevronDown, ChevronUp, Mail, Phone, Package,
  Clock, RefreshCw, CheckCircle2, MessageSquare, User, Send,
} from 'lucide-react';

const STATUS_CONFIG = {
  new:          { label: 'New',         icon: Clock,        bg: 'bg-alibaba-100 text-alibaba-700' },
  'in-progress':{ label: 'In Progress', icon: RefreshCw,    bg: 'bg-amber-100 text-amber-700' },
  closed:       { label: 'Closed',      icon: CheckCircle2, bg: 'bg-green-100 text-green-700' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg)}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [counts, setCounts] = useState({ all: 0, new: 0, 'in-progress': 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchInquiries = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/inquiries', { params });
      setInquiries(res.data.inquiries || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate]);

  const fetchCounts = useCallback(async () => {
    try {
      const [all, newR, inpR, closedR] = await Promise.all([
        api.get('/inquiries', { params: { page: 1, limit: 1 } }),
        api.get('/inquiries', { params: { page: 1, limit: 1, status: 'new' } }),
        api.get('/inquiries', { params: { page: 1, limit: 1, status: 'in-progress' } }),
        api.get('/inquiries', { params: { page: 1, limit: 1, status: 'closed' } }),
      ]);
      setCounts({
        all: all.data.pagination?.total || 0,
        new: newR.data.pagination?.total || 0,
        'in-progress': inpR.data.pagination?.total || 0,
        closed: closedR.data.pagination?.total || 0,
      });
    } catch {}
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const clearFilters = () => {
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setReplyText('');
  };

  const handleSendReply = async (id) => {
    if (!replyText.trim()) return toast.error('Reply text is required');
    setReplying(true);
    try {
      await api.post(`/inquiries/${id}/reply`, { replyText });
      toast.success('Reply sent to buyer');
      setReplyText('');
      fetchInquiries(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/inquiries/${id}/status`, { status });
      toast.success('Status updated');
      fetchInquiries(pagination.page);
      fetchCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Inquiries</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide buyer inquiry management</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',       value: counts.all,              bg: 'bg-gray-50 border-gray-200',  text: 'text-gray-700' },
          { label: 'New',         value: counts.new,              bg: 'bg-alibaba-50 border-alibaba-200',  text: 'text-alibaba-700' },
          { label: 'In Progress', value: counts['in-progress'],   bg: 'bg-amber-50 border-amber-200',text: 'text-amber-700' },
          { label: 'Closed',      value: counts.closed,           bg: 'bg-green-50 border-green-200',text: 'text-green-700' },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={cn('rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow', bg)}
            onClick={() => setStatusFilter(label === 'Total' ? 'all' : label.toLowerCase().replace(' ', '-'))}>
            <p className={cn('text-2xl font-bold', text)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 text-sm" />
          <span className="text-gray-400 text-sm">to</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 text-sm" />
        </div>

        {(statusFilter !== 'all' || startDate || endDate) && (
          <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400 text-sm">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No inquiries found</p>
          </div>
        ) : (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-8 px-4 py-3" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Replied</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <>
                    <tr key={inq._id}
                      className={cn('cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors',
                        expandedId === inq._id && 'bg-gray-50')}
                      onClick={() => toggleExpand(inq._id)}>
                      <td className="px-4 py-3.5">
                        {expandedId === inq._id
                          ? <ChevronUp className="h-4 w-4 text-gray-400" />
                          : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900">{inq.buyerName}</p>
                        <p className="text-xs text-gray-400">{inq.buyerEmail}</p>
                      </td>
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <p className="text-gray-800 truncate">{inq.productId?.title || '—'}</p>
                        {inq.productId?.category && (
                          <p className="text-xs text-gray-400">{inq.productId.category}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-800">{inq.sellerId?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{inq.sellerId?.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(inq.createdAt)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={inq.status} /></td>
                      <td className="px-4 py-3.5">
                        {inq.sellerReply ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />Yes
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>

                    {expandedId === inq._id && (
                      <tr key={`${inq._id}-detail`} className="bg-alibaba-50/30 border-b border-gray-100">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Contact */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />Buyer Contact
                              </p>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2 text-gray-700">
                                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                                  <a href={`mailto:${inq.buyerEmail}`} className="text-navy-600 hover:underline">{inq.buyerEmail}</a>
                                </p>
                                {inq.buyerPhone && (
                                  <p className="flex items-center gap-2 text-gray-700">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />{inq.buyerPhone}
                                  </p>
                                )}
                                {inq.quantity && (
                                  <p className="flex items-center gap-2 text-gray-700">
                                    <Package className="h-3.5 w-3.5 text-gray-400" />Qty: <strong>{inq.quantity}</strong>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Buyer message */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />Buyer Message
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inq.message}</p>
                            </div>

                            {/* Seller reply / admin reply */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />Reply
                              </p>
                              {inq.sellerReply ? (
                                <>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inq.sellerReply}</p>
                                  {inq.repliedAt && (
                                    <p className="text-xs text-gray-400 mt-2">Replied: {formatDate(inq.repliedAt)}</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-gray-400 italic mb-2">No reply yet — you can reply on the seller's behalf</p>
                              )}
                              <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                <Textarea
                                  placeholder="Write a reply to the buyer..."
                                  rows={2}
                                  value={expandedId === inq._id ? replyText : ''}
                                  onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={() => handleSendReply(inq._id)} disabled={replying}>
                                    {replying ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                                    Send Reply
                                  </Button>
                                  <Select value={inq.status} onValueChange={(v) => handleStatusChange(inq._id, v)}>
                                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
                {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => fetchInquiries(p)}
                    className={cn('w-8 h-8 rounded text-sm font-medium transition-colors',
                      pagination.page === p ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
