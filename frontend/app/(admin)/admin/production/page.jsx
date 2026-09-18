'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Scissors, Shirt, Box, CheckCircle2, UserPlus, Users, Trash2, Plus } from 'lucide-react';

const STAGE_CONFIG = {
  cutting: { label: 'Cutting', icon: Scissors, bg: 'bg-amber-100 text-amber-700' },
  stitching: { label: 'Stitching', icon: Shirt, bg: 'bg-alibaba-100 text-alibaba-700' },
  packing: { label: 'Packing', icon: Box, bg: 'bg-purple-100 text-purple-700' },
  done: { label: 'Done', icon: CheckCircle2, bg: 'bg-green-100 text-green-700' },
};

export default function AdminProductionPage() {
  const [stageCounts, setStageCounts] = useState({ cutting: 0, stitching: 0, packing: 0, done: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [showWorkers, setShowWorkers] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', phone: '', department: 'cutting', hourlyRate: '' });
  const [addingWorker, setAddingWorker] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignForm, setAssignForm] = useState({ workerId: '', stage: 'cutting', hoursLogged: '' });
  const [assigning, setAssigning] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/production/overview');
      setStageCounts(res.data.stageCounts || {});
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await api.get('/admin/workers');
      setWorkers(res.data.workers || []);
    } catch {
      setWorkers([]);
    }
  }, []);

  useEffect(() => { fetchOverview(); fetchWorkers(); }, []);

  const handleAddWorker = async () => {
    if (!newWorker.name.trim()) return toast.error('Worker name required');
    setAddingWorker(true);
    try {
      await api.post('/admin/workers', newWorker);
      toast.success('Worker added');
      setNewWorker({ name: '', phone: '', department: 'cutting', hourlyRate: '' });
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add worker');
    } finally {
      setAddingWorker(false);
    }
  };

  const handleDeleteWorker = async (id) => {
    try {
      await api.delete(`/admin/workers/${id}`);
      toast.success('Worker removed');
      fetchWorkers();
    } catch {
      toast.error('Failed to remove worker');
    }
  };

  const openAssign = (order) => {
    setAssignTarget(order);
    setAssignForm({ workerId: '', stage: order.productionStage, hoursLogged: '' });
  };

  const handleAssign = async () => {
    if (!assignForm.workerId) return toast.error('Select a worker');
    setAssigning(true);
    try {
      await api.post('/admin/production/assignments', {
        workerId: assignForm.workerId,
        orderId: assignTarget._id,
        stage: assignForm.stage,
        hoursLogged: assignForm.hoursLogged,
      });
      toast.success('Worker assigned to order');
      setAssignTarget(null);
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign worker');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (id) => {
    try {
      await api.delete(`/admin/production/assignments/${id}`);
      toast.success('Assignment removed');
      fetchOverview();
    } catch {
      toast.error('Failed to remove assignment');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Management</h1>
          <p className="text-gray-500 text-sm mt-1">Stage tracking, worker assignment & time logging</p>
        </div>
        <Button variant="outline" onClick={() => setShowWorkers(true)}>
          <Users className="h-4 w-4 mr-2" />Manage Workers
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(STAGE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', cfg.bg)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stageCounts[key] || 0}</p>
              <p className="text-xs text-gray-500">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No active production orders</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Workers</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const cfg = STAGE_CONFIG[order.productionStage] || STAGE_CONFIG.cutting;
                  const pct = order.quantity ? Math.round((order.unitsCompleted / order.quantity) * 100) : 0;
                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 max-w-[160px] truncate">{order.title}</p>
                        <p className="text-xs text-gray-400">{order.buyerId?.name} → {order.sellerId?.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg)}>{cfg.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-navy-600" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{order.unitsCompleted}/{order.quantity} ({pct}%)</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {order.assignments?.length > 0 ? (
                          <div className="space-y-1">
                            {order.assignments.map((a) => (
                              <div key={a._id} className="flex items-center gap-1.5 text-xs">
                                <span className="font-medium">{a.workerId?.name}</span>
                                <span className="text-gray-400 capitalize">({a.stage}, {a.hoursLogged}h)</span>
                                <button onClick={() => handleRemoveAssignment(a._id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No workers assigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openAssign(order)}>
                          <UserPlus className="h-3 w-3 mr-1" />Assign
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workers management dialog */}
      <Dialog open={showWorkers} onOpenChange={setShowWorkers}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Workers</DialogTitle></DialogHeader>

          <div className="border border-gray-200 rounded-lg p-3 mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" />Add Worker</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={newWorker.name} onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })} />
              <Input placeholder="Phone" value={newWorker.phone} onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={newWorker.department} onValueChange={(v) => setNewWorker({ ...newWorker, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cutting">Cutting</SelectItem>
                  <SelectItem value="stitching">Stitching</SelectItem>
                  <SelectItem value="packing">Packing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Hourly rate" type="number" value={newWorker.hourlyRate} onChange={(e) => setNewWorker({ ...newWorker, hourlyRate: e.target.value })} />
            </div>
            <Button size="sm" onClick={handleAddWorker} disabled={addingWorker}>
              {addingWorker && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Add Worker
            </Button>
          </div>

          <div className="space-y-2">
            {workers.map((w) => (
              <div key={w._id} className="flex items-center justify-between border border-gray-100 rounded-lg p-2.5">
                <div>
                  <p className="text-sm font-medium">{w.name} <span className="text-xs text-gray-400 capitalize">({w.department})</span></p>
                  <p className="text-xs text-gray-500">{w.phone} · ${w.hourlyRate}/hr</p>
                </div>
                <button onClick={() => handleDeleteWorker(w._id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {workers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No workers yet</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkers(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign worker dialog */}
      <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
        <DialogContent className="max-w-md">
          {assignTarget && (
            <>
              <DialogHeader><DialogTitle>Assign Worker — {assignTarget.title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={assignForm.workerId} onValueChange={(v) => setAssignForm({ ...assignForm, workerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>
                    {workers.filter((w) => w.status === 'active').map((w) => (
                      <SelectItem key={w._id} value={w._id}>{w.name} ({w.department})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={assignForm.stage} onValueChange={(v) => setAssignForm({ ...assignForm, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cutting">Cutting</SelectItem>
                    <SelectItem value="stitching">Stitching</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Hours logged" type="number" value={assignForm.hoursLogged}
                  onChange={(e) => setAssignForm({ ...assignForm, hoursLogged: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
                <Button onClick={handleAssign} disabled={assigning}>
                  {assigning && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Assign
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
