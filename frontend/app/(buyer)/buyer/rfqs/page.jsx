'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, Package, Clock, CheckCircle2, XCircle, ArrowRight, Loader2, MessageCircle, Send, Scale } from 'lucide-react';
import toast from 'react-hot-toast';

function NegotiationChat({ rfqId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/messages/rfq/${rfqId}`);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/rfq/${rfqId}`, { text });
      setText('');
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="max-h-48 overflow-y-auto space-y-2 mb-2">
        {loading ? (
          <p className="text-xs text-gray-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400">No messages yet — negotiate terms here</p>
        ) : (
          messages.map((m) => (
            <div key={m._id} className={cn('text-xs px-3 py-1.5 rounded-lg max-w-[80%]', m.senderRole === 'buyer' ? 'bg-navy-50 text-navy-800 ml-auto' : 'bg-gray-100 text-gray-700')}>
              {m.text}
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
        <Button size="sm" disabled={sending} onClick={send}><Send className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  pending:  { label: 'Awaiting Quote', color: 'bg-amber-100 text-amber-700',  icon: Clock },
  quoted:   { label: 'Quoted',         color: 'bg-alibaba-100 text-alibaba-700',    icon: FileText },
  accepted: { label: 'Accepted',       color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected',       color: 'bg-gray-100 text-gray-500',   icon: XCircle },
  expired:  { label: 'Expired',        color: 'bg-gray-100 text-gray-500',   icon: XCircle },
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

export default function BuyerRFQsPage() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [chatOpenId, setChatOpenId] = useState(null);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rfqs/mine');
      setRfqs(res.data.rfqs || []);
    } catch {
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

  const accept = async (rfq) => {
    setActingId(rfq._id);
    try {
      await api.patch(`/rfqs/${rfq._id}/accept`);
      toast.success('Quote accepted — order created!');
      fetchRfqs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept quote');
    } finally {
      setActingId(null);
    }
  };

  const reject = async (rfq) => {
    setActingId(rfq._id);
    try {
      await api.patch(`/rfqs/${rfq._id}/reject`);
      toast.success('Quote rejected');
      fetchRfqs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject quote');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold">My Quote Requests</h1>
          <p className="text-navy-200 text-sm mt-1">Track RFQs sent to sellers and respond to quotes</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-28" />)}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No quote requests yet</p>
            <p className="text-sm text-gray-400 mt-1">Request a quote from a product page to get started</p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/products">Browse Products <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rfqs.map((rfq) => (
              <div key={rfq._id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                    {rfq.productId?.images?.[0] ? (
                      <Image src={rfq.productId.images[0]} alt={rfq.title} fill className="object-contain p-1.5" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-7 w-7 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{rfq.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty: {rfq.quantity} &middot; Seller: {rfq.sellerId?.name || '—'} &middot; {formatDate(rfq.createdAt)}
                    </p>
                    {rfq.specs && <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-md px-2.5 py-1.5">{rfq.specs}</p>}
                    {rfq.status === 'quoted' && (
                      <div className="mt-2 bg-alibaba-50 border border-alibaba-100 rounded-lg px-3 py-2">
                        <p className="text-sm font-semibold text-alibaba-700">
                          ${rfq.quote.price}/unit{rfq.quote.leadTimeDays ? ` · ${rfq.quote.leadTimeDays} day lead time` : ''}
                        </p>
                        {rfq.quote.notes && <p className="text-xs text-alibaba-600 mt-0.5">{rfq.quote.notes}</p>}
                        <p className="text-sm font-bold text-alibaba-800 mt-1">
                          Total: ${(rfq.quote.price * rfq.quantity).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={rfq.status} />
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                  {rfq.status === 'quoted' && (
                    <>
                      <Button size="sm" variant="primary" disabled={actingId === rfq._id} onClick={() => accept(rfq)}>
                        {actingId === rfq._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                        Accept Quote
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" disabled={actingId === rfq._id} onClick={() => reject(rfq)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {rfq.requestGroupId && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/buyer/rfqs/compare/${rfq.requestGroupId}`}><Scale className="h-3.5 w-3.5 mr-1" /> Compare Quotes</Link>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setChatOpenId(chatOpenId === rfq._id ? null : rfq._id)}>
                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> Negotiate
                  </Button>
                </div>

                {chatOpenId === rfq._id && <NegotiationChat rfqId={rfq._id} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
