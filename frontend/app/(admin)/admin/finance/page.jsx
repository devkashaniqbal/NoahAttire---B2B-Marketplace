'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';

const CATEGORY_CONFIG = {
  material: { label: 'Material', bg: 'bg-alibaba-100 text-alibaba-700' },
  labor: { label: 'Labor', bg: 'bg-purple-100 text-purple-700' },
  electricity: { label: 'Electricity', bg: 'bg-amber-100 text-amber-700' },
  delivery: { label: 'Delivery', bg: 'bg-green-100 text-green-700' },
  other: { label: 'Other', bg: 'bg-gray-100 text-gray-700' },
};

export default function AdminFinancePage() {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'material', description: '', amount: '', date: '' });
  const [adding, setAdding] = useState(false);
  const [range, setRange] = useState('month');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        api.get('/admin/finance/summary'),
        api.get('/admin/expenses', { params: { limit: 25 } }),
      ]);
      setSummary(summaryRes.data.summary);
      setExpenses(expensesRes.data.expenses || []);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const handleAddExpense = async () => {
    if (!newExpense.description.trim()) return toast.error('Description required');
    const amt = Number(newExpense.amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setAdding(true);
    try {
      await api.post('/admin/expenses', newExpense);
      toast.success('Expense recorded');
      setShowAdd(false);
      setNewExpense({ category: 'material', description: '', amount: '', date: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/admin/expenses/${id}`);
      toast.success('Expense deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>;

  const maxTrend = summary?.trend?.length
    ? Math.max(...summary.trend.flatMap((d) => [d.revenue, d.expenses])) || 1
    : 1;

  const view = range === 'today'
    ? { revenue: summary?.today?.revenue || 0, expenses: summary?.today?.expenses || 0, profit: summary?.today?.profit || 0 }
    : { revenue: summary?.revenue || 0, expenses: summary?.totalExpenses || 0, profit: summary?.profit || 0 };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue, expenses & profit</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setRange('today')}
              className={cn('px-3 py-1.5 text-xs font-semibold', range === 'today' ? 'bg-navy-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
            >
              Today
            </button>
            <button
              onClick={() => setRange('month')}
              className={cn('px-3 py-1.5 text-xs font-semibold', range === 'month' ? 'bg-navy-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
            >
              This Month
            </button>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Record Expense</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><TrendingUp className="h-4 w-4 text-green-500" />Revenue <span className="text-gray-300">&middot; {range === 'today' ? 'Today' : 'This Month'}</span></div>
          <p className="text-2xl font-bold text-gray-900">${view.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><TrendingDown className="h-4 w-4 text-red-500" />Expenses <span className="text-gray-300">&middot; {range === 'today' ? 'Today' : 'This Month'}</span></div>
          <p className="text-2xl font-bold text-gray-900">${view.expenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><DollarSign className="h-4 w-4 text-navy-500" />Profit <span className="text-gray-300">&middot; {range === 'today' ? 'Today' : 'This Month'}</span></div>
          <p className={cn('text-2xl font-bold', view.profit >= 0 ? 'text-green-600' : 'text-red-600')}>
            ${view.profit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</p>
          <div className="space-y-2.5">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
              const val = summary?.expensesByCategory?.[key] || 0;
              const total = summary?.totalExpenses || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={cn('font-medium px-1.5 py-0.5 rounded', cfg.bg)}>{cfg.label}</span>
                    <span className="text-gray-500">${val.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-navy-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">30-Day Revenue vs Expenses</p>
          <div className="flex items-end gap-1 h-36">
            {(summary?.trend || []).map((d) => (
              <div key={d.date} className="flex-1 flex items-end gap-0.5 h-full" title={`${d.date}: Rev $${d.revenue}, Exp $${d.expenses}`}>
                <div className="flex-1 bg-green-400 rounded-t" style={{ height: `${(d.revenue / maxTrend) * 100}%` }} />
                <div className="flex-1 bg-red-300 rounded-t" style={{ height: `${(d.expenses / maxTrend) * 100}%` }} />
              </div>
            ))}
            {(!summary?.trend || summary.trend.length === 0) && (
              <p className="text-sm text-gray-400 m-auto">No data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">Recent Expenses</p>
        </div>
        {expenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No expenses recorded yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-900">{e.description}</td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', CATEGORY_CONFIG[e.category]?.bg)}>
                      {CATEGORY_CONFIG[e.category]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium">${e.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(e.date)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDeleteExpense(e._id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Description" value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Amount ($)" type="number" value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
              <Input type="date" value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={adding}>
              {adding && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
