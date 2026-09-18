'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Plus, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Trash2, Package, Boxes } from 'lucide-react';

export default function AdminInventoryPage() {
  const [tab, setTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'meters', quantity: '', lowStockThreshold: '50', costPerUnit: '' });
  const [adding, setAdding] = useState(false);
  const [txTarget, setTxTarget] = useState(null);
  const [txForm, setTxForm] = useState({ type: 'in', quantity: '', note: '' });
  const [submittingTx, setSubmittingTx] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/raw-materials');
      setMaterials(res.data.materials || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/inventory/finished-goods');
      setProducts(res.data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'materials') fetchMaterials();
    else fetchProducts();
  }, [tab]);

  const handleAddMaterial = async () => {
    if (!newMaterial.name.trim()) return toast.error('Material name required');
    setAdding(true);
    try {
      await api.post('/admin/raw-materials', newMaterial);
      toast.success('Raw material added');
      setShowAdd(false);
      setNewMaterial({ name: '', unit: 'meters', quantity: '', lowStockThreshold: '50', costPerUnit: '' });
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add material');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    try {
      await api.delete(`/admin/raw-materials/${id}`);
      toast.success('Material deleted');
      fetchMaterials();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleTransaction = async () => {
    const qty = Number(txForm.quantity);
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity');
    setSubmittingTx(true);
    try {
      await api.post(`/admin/raw-materials/${txTarget._id}/transaction`, txForm);
      toast.success(`Stock ${txForm.type === 'in' ? 'added' : 'removed'}`);
      setTxTarget(null);
      setTxForm({ type: 'in', quantity: '', note: '' });
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    } finally {
      setSubmittingTx(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock</h1>
          <p className="text-gray-500 text-sm mt-1">Raw materials and finished goods, with low-stock alerts</p>
        </div>
        {tab === 'materials' && (
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Raw Material</Button>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button onClick={() => setTab('materials')}
          className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
            tab === 'materials' ? 'bg-white shadow-sm text-navy-600' : 'text-gray-500 hover:text-gray-700')}>
          <Boxes className="h-3.5 w-3.5" />Raw Materials
        </button>
        <button onClick={() => setTab('finished')}
          className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
            tab === 'finished' ? 'bg-white shadow-sm text-navy-600' : 'text-gray-500 hover:text-gray-700')}>
          <Package className="h-3.5 w-3.5" />Finished Goods
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
        ) : tab === 'materials' ? (
          materials.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No raw materials yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Material</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost/Unit</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materials.map((m) => {
                    const low = m.quantity <= m.lowStockThreshold;
                    return (
                      <tr key={m._id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{m.name}</td>
                        <td className="px-5 py-3.5 text-gray-700">{m.quantity} {m.unit}</td>
                        <td className="px-5 py-3.5 text-gray-700">${m.costPerUnit}</td>
                        <td className="px-5 py-3.5">
                          {low ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />Low Stock
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">In Stock</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="outline" size="sm" className="h-7 text-xs"
                              onClick={() => { setTxTarget(m); setTxForm({ type: 'in', quantity: '', note: '' }); }}>
                              <ArrowDownCircle className="h-3 w-3 mr-1" />In
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs"
                              onClick={() => { setTxTarget(m); setTxForm({ type: 'out', quantity: '', note: '' }); }}>
                              <ArrowUpCircle className="h-3 w-3 mr-1" />Out
                            </Button>
                            <button onClick={() => handleDeleteMaterial(m._id)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const low = p.stock <= p.lowStockThreshold;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            <Image src={p.images[0]} alt={p.title} width={36} height={36} className="w-9 h-9 rounded-md object-cover border border-gray-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center"><Package className="h-4 w-4 text-gray-400" /></div>
                          )}
                          <p className="font-medium text-gray-900 max-w-[200px] truncate">{p.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{p.sellerId?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-700">{p.stock} {p.unit}</td>
                      <td className="px-5 py-3.5">
                        {low ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />Low Stock
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Raw Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Material name (e.g. Cotton Fabric)" value={newMaterial.name}
              onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Unit (e.g. meters, kg)" value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })} />
              <Input placeholder="Initial quantity" type="number" value={newMaterial.quantity}
                onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Low stock threshold" type="number" value={newMaterial.lowStockThreshold}
                onChange={(e) => setNewMaterial({ ...newMaterial, lowStockThreshold: e.target.value })} />
              <Input placeholder="Cost per unit ($)" type="number" value={newMaterial.costPerUnit}
                onChange={(e) => setNewMaterial({ ...newMaterial, costPerUnit: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddMaterial} disabled={adding}>
              {adding && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!txTarget} onOpenChange={() => setTxTarget(null)}>
        <DialogContent className="max-w-sm">
          {txTarget && (
            <>
              <DialogHeader><DialogTitle>{txForm.type === 'in' ? 'Add' : 'Remove'} Stock — {txTarget.name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={txForm.type} onValueChange={(v) => setTxForm({ ...txForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Quantity" type="number" value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} />
                <Input placeholder="Note (optional)" value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTxTarget(null)}>Cancel</Button>
                <Button onClick={handleTransaction} disabled={submittingTx}>
                  {submittingTx && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Confirm
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
