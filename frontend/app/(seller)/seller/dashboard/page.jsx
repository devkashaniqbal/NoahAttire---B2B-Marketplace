'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Package, MessageSquare, TrendingUp, Plus, ArrowRight, Inbox } from 'lucide-react';

const STATUS_VARIANT = { new: 'new', 'in-progress': 'in-progress', closed: 'closed' };
const STATUS_LABEL = { new: 'New', 'in-progress': 'In Progress', closed: 'Closed' };

export default function SellerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, inquiriesRes] = await Promise.all([
          api.get('/products/me/list', { params: { limit: 1 } }),
          api.get('/inquiries/mine', { params: { limit: 5 } }),
        ]);
        setStats({
          totalProducts: productsRes.data.pagination?.total || 0,
          totalInquiries: inquiriesRes.data.pagination?.total || 0,
          newInquiries: (inquiriesRes.data.inquiries || []).filter((i) => i.status === 'new').length,
        });
        setRecentInquiries(inquiriesRes.data.inquiries || []);
      } catch {
        setStats({ totalProducts: 0, totalInquiries: 0, newInquiries: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Seller Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your products and respond to inquiries</p>
        </div>
        <Button asChild>
          <Link href="/seller/products">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Card className="border-l-4 border-l-navy-600">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Listings</p>
                  <p className="text-3xl font-bold text-navy-600 mt-1">{stats.totalProducts}</p>
                  <p className="text-xs text-gray-400 mt-1">Active products</p>
                </div>
                <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-navy-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gold-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Inquiries</p>
                  <p className="text-3xl font-bold text-gold-600 mt-1">{stats.totalInquiries}</p>
                  <p className="text-xs text-gray-400 mt-1">All time received</p>
                </div>
                <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-gold-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-alibaba-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">New Inquiries</p>
                  <p className="text-3xl font-bold text-alibaba-600 mt-1">{stats.newInquiries}</p>
                  <p className="text-xs text-gray-400 mt-1">Awaiting response</p>
                </div>
                <div className="w-12 h-12 bg-alibaba-50 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-alibaba-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Inquiries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Inquiries</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/inquiries" className="flex items-center gap-1 text-navy-600">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : recentInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium text-sm">No inquiries yet</p>
              <p className="text-gray-400 text-xs mt-1">Inquiries from buyers will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInquiries.map((inq) => (
                  <TableRow key={inq._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{inq.buyerName}</p>
                        <p className="text-xs text-gray-500">{inq.buyerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 max-w-[180px]">
                      <span className="truncate block">{inq.productId?.title || 'Deleted product'}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(inq.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[inq.status]}>{STATUS_LABEL[inq.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
