'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Package, MessageSquare, Store, Building2, LogOut, ChevronRight, Shield,
  ClipboardList, Factory, Boxes, DollarSign, FileText, AlertTriangle, Settings, BookOpen, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/admin/dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/orders',     label: 'Orders',            icon: ClipboardList },
  { href: '/admin/production', label: 'Production',        icon: Factory },
  { href: '/admin/inventory',  label: 'Inventory',         icon: Boxes },
  { href: '/admin/finance',    label: 'Finance',           icon: DollarSign },
  { href: '/admin/invoices',   label: 'Invoices',          icon: FileText },
  { href: '/admin/alerts',     label: 'Alerts',            icon: AlertTriangle },
  { href: '/admin/sellers',    label: 'Seller Approvals',  icon: Store },
  { href: '/admin/products',    label: 'Product Moderation', icon: Package },
  { href: '/admin/categories',  label: 'Categories',         icon: Tag },
  { href: '/admin/inquiries',   label: 'All Inquiries',      icon: MessageSquare },
  { href: '/admin/users',      label: 'Users',             icon: Users },
  { href: '/seller/dashboard', label: 'My Seller Account', icon: Store },
  { href: '/admin/blogs',      label: 'Blog Posts',        icon: BookOpen },
  { href: '/admin/settings',   label: 'Site Settings',     icon: Settings },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=' + pathname);
      } else if (user.role !== 'admin') {
        router.push('/');
        toast.error('Admin access only');
      }
    }
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-navy-600 text-sm">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 h-screen z-30">
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold-500" />
            <div>
              <p className="text-sm font-semibold">Admin Panel</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-1"
          >
            <Building2 className="h-4 w-4" />
            View Marketplace
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
