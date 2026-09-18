'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';

export default function InquiryForm({ productId, productTitle, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    buyerName: user?.name || '',
    buyerEmail: user?.email || '',
    buyerPhone: '',
    message: '',
    quantity: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.buyerName || !form.buyerEmail || !form.message) {
      toast.error('Name, email, and message are required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/inquiries', { ...form, productId });
      toast.success('Inquiry sent successfully! Check your email for confirmation.');
      setForm({
        buyerName: user?.name || '',
        buyerEmail: user?.email || '',
        buyerPhone: '',
        message: '',
        quantity: '',
      });
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {productTitle && (
        <div className="bg-navy-50 rounded-md px-4 py-3 mb-2">
          <p className="text-xs text-navy-500 font-medium">Inquiring about:</p>
          <p className="text-sm font-semibold text-navy-700 line-clamp-1">{productTitle}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="buyerName">Full Name *</Label>
          <Input
            id="buyerName"
            name="buyerName"
            placeholder="John Smith"
            value={form.buyerName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buyerEmail">Email Address *</Label>
          <Input
            id="buyerEmail"
            name="buyerEmail"
            type="email"
            placeholder="john@company.com"
            value={form.buyerEmail}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="buyerPhone">Phone Number</Label>
          <Input
            id="buyerPhone"
            name="buyerPhone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={form.buyerPhone}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Required Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            placeholder="e.g. 500 units / 5 tons"
            value={form.quantity}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Describe your requirements, delivery timeline, destination port, payment terms, etc."
          value={form.message}
          onChange={handleChange}
          rows={4}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading} size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Inquiry...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Inquiry
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        No registration required. The seller will contact you directly.
      </p>
    </form>
  );
}
