'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, Loader2 } from 'lucide-react';

export default function RFQForm({ product, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    quantity: product?.minOrderQty || 1,
    targetPrice: '',
    specs: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || Number(form.quantity) < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    setLoading(true);
    try {
      await api.post('/rfqs', { ...form, productId: product._id });
      toast.success('Quote request submitted');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-navy-50 rounded-md px-4 py-3">
        <p className="text-xs text-navy-500 font-medium">Requesting a quote for:</p>
        <p className="text-sm font-semibold text-navy-700 line-clamp-1">{product?.title}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rfq-quantity">Quantity *</Label>
        <Input
          id="rfq-quantity"
          type="number"
          min={1}
          value={form.quantity}
          onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rfq-target-price">Target Price (per unit, USD)</Label>
        <Input
          id="rfq-target-price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Optional — your budget"
          value={form.targetPrice}
          onChange={(e) => setForm((p) => ({ ...p, targetPrice: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rfq-specs">Specifications / Requirements</Label>
        <Textarea
          id="rfq-specs"
          placeholder="Custom logo, colors, sizes, packaging requirements, delivery timeline..."
          value={form.specs}
          onChange={(e) => setForm((p) => ({ ...p, specs: e.target.value }))}
          rows={4}
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={loading} size="lg">
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          <><FileText className="mr-2 h-4 w-4" /> Request Quote</>
        )}
      </Button>
    </form>
  );
}
