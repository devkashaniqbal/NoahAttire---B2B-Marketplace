'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { LifeBuoy, Plus, Clock, RefreshCw, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  open:          { label: 'Open',        color: 'bg-amber-100 text-amber-700',  icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-alibaba-100 text-alibaba-700',    icon: RefreshCw },
  resolved:      { label: 'Resolved',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  closed:        { label: 'Closed',      color: 'bg-gray-100 text-gray-500',    icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to My Orders to see live status, production progress, and tracking info once shipped.' },
  { q: 'How do I cancel an order?', a: 'Pending orders can be cancelled instantly. Orders already in production require supplier approval — request cancellation from the Orders page.' },
  { q: 'How do refunds work?', a: 'Approved return/refund requests are credited to your Credit Balance, viewable on the Payments page.' },
  { q: 'How do I compare quotes from multiple suppliers?', a: 'Use "Compare Quotations" on the Quote Requests page to broadcast an RFQ to multiple sellers at once.' },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [form, setForm] = useState({ subject: '', category: 'other', description: '' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/mine');
      setTickets(res.data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return toast.error('Subject and description are required');
    setSubmitting(true);
    try {
      await api.post('/support', form);
      toast.success('Ticket raised — our team will respond shortly');
      setOpen(false);
      setForm({ subject: '', category: 'other', description: '' });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Support Center</h1>
            <p className="text-navy-200 text-sm mt-1">Raise tickets, file complaints, and find answers</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg"><Plus className="mr-2 h-4 w-4" /> Raise Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Raise a Support Ticket</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['order', 'payment', 'product', 'account', 'complaint', 'other'].map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your issue in detail..." />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">My Tickets</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-20" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <LifeBuoy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tickets raised yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t._id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{t.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{t.category} &middot; {formatDate(t.createdAt)}</p>
                      <p className="text-sm text-gray-600 mt-2">{t.description}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">FAQs</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {FAQS.map((f, i) => (
              <div key={i} className="p-4">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex items-center justify-between w-full text-left">
                  <span className="text-sm font-medium text-gray-800">{f.q}</span>
                  <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform flex-shrink-0', faqOpen === i && 'rotate-180')} />
                </button>
                {faqOpen === i && <p className="text-sm text-gray-500 mt-2">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
