'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Package, CheckCircle2, Clock, Scale, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompareQuotesPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/rfqs/group/${groupId}`);
      setRfqs(res.data.rfqs || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroup(); }, [groupId]);

  const bestPrice = rfqs.filter((r) => r.quote?.price).reduce((min, r) => Math.min(min, r.quote.price), Infinity);
  const bestLeadTime = rfqs.filter((r) => r.quote?.leadTimeDays).reduce((min, r) => Math.min(min, r.quote.leadTimeDays), Infinity);

  const accept = async (rfq) => {
    setActingId(rfq._id);
    try {
      await api.patch(`/rfqs/${rfq._id}/accept`);
      toast.success('Quote accepted — order created!');
      router.push('/buyer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept quote');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Scale className="h-6 w-6" /> Compare Quotations</h1>
          <p className="text-navy-200 text-sm mt-1">Side-by-side comparison of supplier quotes for this request</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-64" />)}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 font-medium">Comparison not found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rfqs.map((rfq) => {
              const isBestPrice = rfq.quote?.price === bestPrice;
              const isBestLead = rfq.quote?.leadTimeDays === bestLeadTime;
              return (
                <div key={rfq._id} className={cn('bg-white rounded-xl border-2 p-5', isBestPrice ? 'border-green-400' : 'border-gray-200')}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      {rfq.productId?.images?.[0] ? (
                        <Image src={rfq.productId.images[0]} alt={rfq.title} fill className="object-contain p-1" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{rfq.sellerId?.name || 'Seller'}</p>
                      <p className="text-xs text-gray-400 truncate">{rfq.title}</p>
                    </div>
                  </div>

                  {rfq.status === 'pending' ? (
                    <div className="bg-amber-50 text-amber-700 text-xs font-medium rounded-lg px-3 py-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Awaiting quote
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">Unit Price</span>
                        <span className={cn('text-lg font-bold', isBestPrice ? 'text-green-600' : 'text-gray-900')}>
                          ${rfq.quote.price} {isBestPrice && <CheckCircle2 className="inline h-4 w-4 ml-0.5" />}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">Lead Time</span>
                        <span className={cn('text-sm font-semibold', isBestLead ? 'text-green-600' : 'text-gray-700')}>
                          {rfq.quote.leadTimeDays ? `${rfq.quote.leadTimeDays} days` : '—'}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between border-t border-gray-100 pt-2">
                        <span className="text-xs text-gray-500">Total ({rfq.quantity} units)</span>
                        <span className="text-sm font-bold text-navy-600">${(rfq.quote.price * rfq.quantity).toLocaleString()}</span>
                      </div>
                      {rfq.quote.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-md px-2.5 py-1.5">{rfq.quote.notes}</p>}

                      {rfq.status === 'quoted' && (
                        <Button size="sm" className="w-full mt-2" disabled={actingId === rfq._id} onClick={() => accept(rfq)}>
                          {actingId === rfq._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                          Accept This Quote
                        </Button>
                      )}
                      {rfq.status === 'accepted' && (
                        <div className="text-center text-xs font-semibold text-green-600 mt-2">Accepted</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
