'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { formatDate, getInitials, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, Store, Loader2, ExternalLink, CheckCircle2, XCircle,
  Clock, ShieldOff, ShieldCheck, AlertTriangle, RefreshCw,
} from 'lucide-react';

const TABS = [
  { value: 'all',      label: 'All Sellers' },
  { value: 'pending',  label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const APPROVAL_CONFIG = {
  pending:  { label: 'Pending',  icon: Clock,         bg: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle2,  bg: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: XCircle,       bg: 'bg-red-100 text-red-700' },
};

function ApprovalBadge({ status }) {
  const cfg = APPROVAL_CONFIG[status] || APPROVAL_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg)}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

function SellersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [actionId, setActionId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSellers = useCallback(async (page = 1, tab = activeTab, q = search) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (tab !== 'all') params.approvalStatus = tab;
      if (q) params.search = q;
      const res = await api.get('/admin/sellers', { params });
      setSellers(res.data.sellers || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => { fetchSellers(1, activeTab); }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/admin/sellers?tab=${tab}`, { scroll: false });
  };

  const patchSeller = async (userId, endpoint, body = {}) => {
    setActionId(userId);
    try {
      await api.patch(`/admin/sellers/${userId}/${endpoint}`, body);
      toast.success(`Seller ${endpoint}d`);
      fetchSellers(pagination.page, activeTab);
    } catch {
      toast.error('Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/sellers/${rejectTarget}/reject`, { reason: rejectReason });
      toast.success('Seller rejected');
      setRejectTarget(null);
      setRejectReason('');
      fetchSellers(pagination.page, activeTab);
    } catch {
      toast.error('Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Approvals</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} seller{pagination.total !== 1 ? 's' : ''} in this view</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSellers(1, activeTab, search)}
            className="pl-9" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => handleTabChange(tab.value)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.value ? 'bg-white shadow-sm text-navy-600' : 'text-gray-500 hover:text-gray-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400 text-sm">Loading sellers...</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Store className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No sellers in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Approval</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sellers.map((seller) => {
                  const displayName = seller.businessName || seller.userId?.name || 'Unknown';
                  const userId = seller.userId?._id;
                  const isBusy = actionId === userId;
                  const approval = seller.approvalStatus || 'pending';
                  const isBanned = seller.userId?.isBanned;

                  return (
                    <tr key={seller._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {seller.logo ? (
                            <Image src={seller.logo} alt={displayName} width={36} height={36}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-navy-700 text-xs font-bold">{getInitials(displayName)}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{seller.userId?.name || '—'}</p>
                            <p className="text-xs text-gray-400">{seller.userId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{seller.businessName || <span className="text-gray-400 italic">Not set</span>}</p>
                        {seller.category && <p className="text-xs text-gray-400">{seller.category}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{seller.location || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <ApprovalBadge status={approval} />
                          {seller.rejectionReason && (
                            <p className="text-xs text-red-500 max-w-[140px] truncate" title={seller.rejectionReason}>
                              {seller.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            <ShieldOff className="h-3 w-3" />Banned
                          </span>
                        ) : seller.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3" />Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {seller.userId?.createdAt ? formatDate(seller.userId.createdAt) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                            <Link href={`/sellers/${seller._id}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>

                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {approval === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => patchSeller(userId, 'approve')}
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-2">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setRejectTarget(userId)}
                                    className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 px-2">
                                    <XCircle className="h-3 w-3 mr-1" />Reject
                                  </Button>
                                </>
                              )}
                              {approval === 'approved' && seller.isActive && (
                                <Button variant="outline" size="sm" onClick={() => patchSeller(userId, 'suspend')}
                                  className="h-7 text-xs border-amber-200 text-amber-600 hover:bg-amber-50 px-2">
                                  <AlertTriangle className="h-3 w-3 mr-1" />Suspend
                                </Button>
                              )}
                              {(approval === 'rejected' || !seller.isActive) && (
                                <Button variant="outline" size="sm" onClick={() => patchSeller(userId, 'reactivate')}
                                  className="h-7 text-xs border-green-200 text-green-600 hover:bg-green-50 px-2">
                                  <RefreshCw className="h-3 w-3 mr-1" />Reactivate
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
            {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => fetchSellers(p, activeTab)}
                className={cn('w-8 h-8 rounded text-sm font-medium transition-colors',
                  pagination.page === p ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Seller</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Optionally provide a reason. The seller can reapply after addressing the issue.</p>
          <Textarea placeholder="Reason for rejection (optional)..."
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminSellersPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <SellersContent />
    </Suspense>
  );
}
