'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Users, Loader2, UserX, UserCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (role !== 'all') params.role = role;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/users/${id}/ban`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBanned: true } : u));
      toast.success('User banned');
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/users/${id}/unban`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBanned: false } : u));
      toast.success('User unbanned');
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} registered user{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-4">
        <Tabs value={role} onValueChange={setRole}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="buyer">Buyers</TabsTrigger>
            <TabsTrigger value="seller">Sellers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-400 text-sm">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-navy-700 text-xs font-bold">{getInitials(user.name)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'seller' ? 'default' : 'secondary'} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {actionLoading === user._id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
                      ) : user.isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs border-green-200 text-green-600 hover:bg-green-50"
                          onClick={() => handleUnban(user._id)}
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleBan(user._id)}
                        >
                          <UserX className="h-3.5 w-3.5 mr-1" />
                          Ban
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => fetchUsers(i + 1)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    pagination.page === i + 1
                      ? 'bg-navy-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
