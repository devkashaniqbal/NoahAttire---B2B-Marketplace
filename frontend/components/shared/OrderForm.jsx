'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Loader2 } from 'lucide-react';

export default function OrderForm({ product, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    quantity: product?.minOrderQty || 1,
    shippingAddress: '',
    expectedDeliveryDate: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || Number(form.quantity) < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    setLoading(true);
    try {
      await api.post('/orders', { ...form, productId: product._id });
      toast.success('Order placed successfully!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const total = (Number(form.quantity) || 0) * (product?.priceRange?.min || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-navy-50 rounded-md px-4 py-3">
        <p className="text-xs text-navy-500 font-medium">Ordering:</p>
        <p className="text-sm font-semibold text-navy-700 line-clamp-1">{product?.title}</p>
        {product?.minOrderQty && (
          <p className="text-xs text-navy-500 mt-1">Min. order: {product.minOrderQty} {product.unit}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={product?.minOrderQty || 1}
          value={form.quantity}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingAddress">Shipping Address</Label>
        <Textarea
          id="shippingAddress"
          name="shippingAddress"
          placeholder="Delivery address, port, or warehouse location"
          value={form.shippingAddress}
          onChange={handleChange}
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expectedDeliveryDate">Preferred Delivery Date</Label>
        <Input
          id="expectedDeliveryDate"
          name="expectedDeliveryDate"
          type="date"
          value={form.expectedDeliveryDate}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-500">Estimated Total</span>
        <span className="text-lg font-bold text-navy-600">${total.toLocaleString()}</span>
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={loading} size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Placing Order...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Place Order
          </>
        )}
      </Button>
    </form>
  );
}
