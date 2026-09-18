'use client';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Inbox, Mail, Phone, Package, Loader2, Send, CheckCircle2,
  Clock, XCircle, RefreshCw, ChevronDown, ChevronUp, MessageSquare,
  User, Calendar, Tag,
} from 'lucide-react';

const TABS = [
  { value: 'all',         label: 'All',         color: 'text-gray-600' },
  { value: 'new',         label: 'New',         color: 'text-alibaba-600' },
  { value: 'in-progress', label: 'In Progress', color: 'text-amber-600' },
  { value: 'closed',      label: 'Closed',      color: 'text-green-600' },
];

const STATUS_CONFIG = {
  new:          { label: 'New',         icon: Clock,         bg: 'bg-alibaba-100 text-alibaba-700 border-alibaba-200' },
  'in-progress':{ label: 'In Progress', icon: RefreshCw,     bg: 'bg-amber-100 text-amber-700 border-amber-200' },
  closed:       { label: 'Closed',      icon: CheckCircle2,  bg: 'bg-green-100 text-green-700 border-green-200' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border', cfg.bg)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function InquiryCard({ inquiry, onStatusChange, onReplySent }) {
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const hasReplied = !!inquiry.sellerReply;
  const product = inquiry.productId;

  const sendReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please write a reply before sending');
      return;
    }
    setSending(true);
    try {
      const res = await api.post(`/inquiries/${inquiry._id}/reply`, { replyText });
      toast.success('Reply sent to buyer!');
      setReplyText('');
      setReplyOpen(false);
      onReplySent(inquiry._id, res.data.inquiry);
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.patch(`/inquiries/${inquiry._id}/status`, { status: newStatus });
      toast.success(`Marked as ${STATUS_CONFIG[newStatus]?.label}`);
      onStatusChange(inquiry._id, res.data.inquiry.status);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={cn(
      'bg-white rounded-xl border transition-all duration-200',
      inquiry.status === 'new' ? 'border-alibaba-200 shadow-sm' : 'border-gray-200',
    )}>
      {/* Card header — always visible */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
            <span className="text-navy-600 font-bold text-sm">
              {inquiry.buyerName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{inquiry.buyerName}</span>
                  <StatusBadge status={inquiry.status} />
                  {hasReplied && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Replied
                    </span>
                  )}
                  {inquiry.status === 'new' && !hasReplied && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-alibaba-600 bg-alibaba-50 px-2 py-0.5 rounded-full animate-pulse">
                      Action needed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {inquiry.buyerEmail}
                  </span>
                  {inquiry.buyerPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {inquiry.buyerPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(inquiry.createdAt)}
                  </span>
                </div>
              </div>
              {expanded
                ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
              }
            </div>

            {/* Product + quantity summary */}
            <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-gray-500">
              {product && (
                <span className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                  <Package className="h-3 w-3" />
                  {product.title}
                </span>
              )}
              {inquiry.quantity && (
                <span className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                  <Tag className="h-3 w-3" />
                  Qty: {inquiry.quantity}
                </span>
              )}
            </div>

            {/* Message preview */}
            {!expanded && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {inquiry.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
          {/* Full message */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Buyer's Message
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
              {inquiry.message}
            </div>
          </div>

          {/* Previous reply */}
          {hasReplied && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Your Reply · {inquiry.repliedAt ? formatDate(inquiry.repliedAt) : ''}
              </p>
              <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-green-100">
                {inquiry.sellerReply}
              </div>
            </div>
          )}

          {/* Reply form */}
          {replyOpen ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">
                {hasReplied ? 'Send Updated Reply' : 'Write Your Reply'}
              </p>
              <Textarea
                placeholder={`Hi ${inquiry.buyerName}, thank you for your inquiry about ${product?.title || 'our product'}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                className="resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex-1 sm:flex-none"
                >
                  {sending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Sending...</>
                  ) : (
                    <><Send className="h-3.5 w-3.5 mr-2" />Send Reply to Buyer</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setReplyOpen(false); setReplyText(''); }}
                  disabled={sending}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                The buyer will receive your reply via email. Status will be set to "In Progress".
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => setReplyOpen(true)}
                className="gap-2"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {hasReplied ? 'Send Another Reply' : 'Reply to Buyer'}
              </Button>

              <a
                href={`mailto:${inquiry.buyerEmail}?subject=Re: Inquiry about ${encodeURIComponent(product?.title || 'your product')}&body=Dear ${encodeURIComponent(inquiry.buyerName)},%0A%0A`}
                className="inline-flex items-center gap-2 text-xs font-medium text-navy-600 border border-navy-200 hover:bg-navy-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Open in Email Client
              </a>

              {inquiry.status !== 'closed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeStatus('closed')}
                  disabled={updating}
                  className="gap-2 text-gray-500 hover:text-gray-700 ml-auto"
                >
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Close Inquiry
                </Button>
              )}
              {inquiry.status === 'new' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeStatus('in-progress')}
                  disabled={updating}
                  className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Mark In Progress
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, 'in-progress': 0, closed: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInquiries = useCallback(async (tab = activeTab, page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (tab !== 'all') params.status = tab;
      const res = await api.get('/inquiries/mine', { params });
      setInquiries(res.data.inquiries || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Load counts for all statuses once
  const fetchCounts = useCallback(async () => {
    try {
      const [all, newRes, inpRes, closedRes] = await Promise.all([
        api.get('/inquiries/mine', { params: { page: 1, limit: 1 } }),
        api.get('/inquiries/mine', { params: { page: 1, limit: 1, status: 'new' } }),
        api.get('/inquiries/mine', { params: { page: 1, limit: 1, status: 'in-progress' } }),
        api.get('/inquiries/mine', { params: { page: 1, limit: 1, status: 'closed' } }),
      ]);
      setCounts({
        all: all.data.pagination?.total || 0,
        new: newRes.data.pagination?.total || 0,
        'in-progress': inpRes.data.pagination?.total || 0,
        closed: closedRes.data.pagination?.total || 0,
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    setCurrentPage(1);
    fetchInquiries(activeTab, 1);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleStatusChange = (id, newStatus) => {
    setInquiries((prev) => prev.map((i) => i._id === id ? { ...i, status: newStatus } : i));
    fetchCounts();
  };

  const handleReplySent = (id, updated) => {
    setInquiries((prev) => prev.map((i) => i._id === id ? { ...i, ...updated } : i));
    fetchCounts();
  };

  const goToPage = (p) => {
    setCurrentPage(p);
    fetchInquiries(activeTab, p);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-600">Inquiry Management</h1>
        <p className="text-gray-500 text-sm mt-1">View and respond to buyer inquiries for your products</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',       value: counts.all,           bg: 'bg-gray-50  border-gray-200',  text: 'text-gray-700' },
          { label: 'New',         value: counts.new,           bg: 'bg-alibaba-50  border-alibaba-200',  text: 'text-alibaba-700' },
          { label: 'In Progress', value: counts['in-progress'],bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'Closed',      value: counts.closed,        bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={cn('rounded-xl border p-4', bg)}>
            <p className={cn('text-2xl font-bold', text)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-white shadow-sm text-navy-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {counts[tab.value] > 0 && (
              <span className={cn(
                'text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold',
                activeTab === tab.value ? 'bg-navy-100 text-navy-600' : 'bg-gray-200 text-gray-500'
              )}>
                {counts[tab.value] > 99 ? '99+' : counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inquiry list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-navy-400 mb-3" />
          <p className="text-gray-400 text-sm">Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
          <Inbox className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No inquiries</h3>
          <p className="text-gray-400 text-sm">
            {activeTab !== 'all'
              ? `No ${STATUS_CONFIG[activeTab]?.label || activeTab} inquiries`
              : 'Buyer inquiries will appear here once they contact you'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <InquiryCard
              key={inq._id}
              inquiry={inq}
              onStatusChange={handleStatusChange}
              onReplySent={handleReplySent}
            />
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    currentPage === p
                      ? 'bg-navy-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
