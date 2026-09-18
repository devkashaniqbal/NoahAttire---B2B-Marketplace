'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Star, MessageCircle, Trash2, BarChart3, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={cn('h-5 w-5', n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
        </button>
      ))}
    </div>
  );
}

function ChatPanel({ sellerId, buyerId }) {
  const threadId = [buyerId, sellerId].sort().join('_');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/messages/seller-chat/${threadId}`);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const send = async () => {
    if (!text.trim()) return;
    try {
      await api.post(`/messages/seller-chat/${threadId}`, { text });
      setText('');
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="border-t border-gray-100 mt-3 pt-3">
      <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
        {loading ? (
          <p className="text-xs text-gray-400">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400">No messages yet — say hello!</p>
        ) : (
          messages.map((m) => (
            <div key={m._id} className={cn('max-w-[80%] rounded-lg px-3 py-1.5 text-sm', m.senderRole === 'buyer' ? 'bg-navy-600 text-white ml-auto' : 'bg-gray-100 text-gray-700')}>
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
          className="flex-1 h-9 px-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy-600"
        />
        <Button size="sm" onClick={send}><Send className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpenFor, setChatOpenFor] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [review, setReview] = useState('');
  const [buyerId, setBuyerId] = useState(null);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const [sellersRes, meRes] = await Promise.all([api.get('/saved-sellers'), api.get('/auth/me')]);
      setSellers(sellersRes.data.sellers || []);
      setBuyerId(meRes.data.user._id);
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const handleUnsave = async (sellerId) => {
    try {
      await api.delete(`/saved-sellers/${sellerId}`);
      toast.success('Removed from saved suppliers');
      fetchSellers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleRate = async (sellerId) => {
    try {
      await api.post(`/saved-sellers/${sellerId}/rate`, { rating: ratingValue, review });
      toast.success('Rating submitted');
      setRatingFor(null);
      setReview('');
      fetchSellers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rate');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold">Supplier Management</h1>
          <p className="text-navy-200 text-sm mt-1">Saved suppliers, ratings, performance, and direct chat</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-32" />)}</div>
        ) : sellers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No saved suppliers yet</p>
            <p className="text-sm text-gray-400 mt-1">Save sellers from product pages to track them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sellers.map((s) => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-navy-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{s.sellerId?.name}</p>
                      <p className="text-xs text-gray-400">{s.sellerId?.email}</p>
                      {s.rating && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={cn('h-3 w-3', n <= s.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setRatingFor(ratingFor === s.sellerId._id ? null : s.sellerId._id)}>
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setChatOpenFor(chatOpenFor === s.sellerId._id ? null : s.sellerId._id)}>
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleUnsave(s.sellerId._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Performance */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{s.performance?.totalOrders || 0}</p>
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1"><BarChart3 className="h-3 w-3" /> Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">${(s.performance?.totalSpend || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Total Spend</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{s.performance?.onTimeRate != null ? `${s.performance.onTimeRate}%` : '—'}</p>
                    <p className="text-[10px] text-gray-400">On-time Rate</p>
                  </div>
                </div>

                {ratingFor === s.sellerId._id && (
                  <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
                    <StarRating value={ratingValue} onChange={setRatingValue} />
                    <Textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Optional review..." />
                    <Button size="sm" onClick={() => handleRate(s.sellerId._id)}>Submit Rating</Button>
                  </div>
                )}

                {chatOpenFor === s.sellerId._id && buyerId && (
                  <ChatPanel sellerId={s.sellerId._id} buyerId={buyerId} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
