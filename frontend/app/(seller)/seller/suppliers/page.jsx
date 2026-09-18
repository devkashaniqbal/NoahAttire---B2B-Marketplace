'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Users, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', material: '', contactPhone: '', contactEmail: '', location: '', lastOrderDate: '', notes: '' };

export default function SellerSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.suppliers || []);
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openAdd = () => {
    setEditSupplier(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (supplier) => {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name || '',
      material: supplier.material || '',
      contactPhone: supplier.contactPhone || '',
      contactEmail: supplier.contactEmail || '',
      location: supplier.location || '',
      lastOrderDate: supplier.lastOrderDate ? supplier.lastOrderDate.split('T')[0] : '',
      notes: supplier.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editSupplier) {
        await api.put(`/suppliers/${editSupplier._id}`, form);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier added');
      }
      setDialogOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      setDeleteConfirm(null);
      fetchSuppliers();
    } catch {
      toast.error('Failed to delete supplier');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Supplier Management</h1>
          <p className="text-gray-500 text-sm mt-1">{suppliers.length} raw-material supplier{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-navy-400" />
              Loading suppliers...
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-14 w-14 text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-1">No suppliers yet</h3>
              <p className="text-gray-400 text-sm mb-5">Add the raw-material suppliers you source from</p>
              <Button variant="primary" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Supplier
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier._id}>
                    <TableCell>
                      <p className="font-medium text-sm text-gray-900">{supplier.name}</p>
                      {supplier.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {supplier.location}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{supplier.material || '—'}</TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {supplier.contactPhone && (
                          <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {supplier.contactPhone}</p>
                        )}
                        {supplier.contactEmail && (
                          <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {supplier.contactEmail}</p>
                        )}
                        {!supplier.contactPhone && !supplier.contactEmail && '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {supplier.lastOrderDate ? formatDate(supplier.lastOrderDate) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(supplier)}>
                          <Pencil className="h-4 w-4 text-navy-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(supplier._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Supplier Name *</Label>
              <Input
                placeholder="e.g. Sialkot Textiles Ltd"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Material Supplied</Label>
                <Input
                  placeholder="e.g. Cotton Fabric"
                  value={form.material}
                  onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  placeholder="e.g. Sialkot, Pakistan"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contact Phone</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Last Order Date</Label>
              <Input
                type="date"
                value={form.lastOrderDate}
                onChange={(e) => setForm((p) => ({ ...p, lastOrderDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Reliability, lead times, pricing notes..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editSupplier ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">Are you sure you want to remove this supplier? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
