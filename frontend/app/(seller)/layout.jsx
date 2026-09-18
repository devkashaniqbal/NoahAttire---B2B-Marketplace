'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, MessageSquare, User, Building2, LogOut, ChevronRight, ClipboardList,
  FileText, Truck, Wallet, Users, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/products', label: 'My Products', icon: Package },
  { href: '/seller/orders', label: 'My Orders', icon: ClipboardList },
  { href: '/seller/rfqs', label: 'Request for Quotations', icon: FileText },
  { href: '/seller/shipments', label: 'Shipments & Tracking', icon: Truck },
  { href: '/seller/payments', label: 'Payments & Billing', icon: Wallet },
  { href: '/seller/suppliers', label: 'Supplier Management', icon: Users },
  { href: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/seller/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/seller/profile', label: 'Business Profile', icon: User },
];

export default function SellerLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=' + pathname);
      } else if (!['seller', 'admin'].includes(user.role)) {
        router.push('/');
        toast.error('Seller access only');
      }
    }
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  if (loading || !user || !['seller', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-navy-600 text-sm">Loading seller portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-600 text-white flex flex-col fixed left-0 top-0 h-screen z-30">
        {/* User info */}
        <div className="px-5 py-5 border-b border-navy-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center font-bold text-sm text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-navy-300 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
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
                    : 'text-navy-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-navy-500">
          {user.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-300 hover:text-white hover:bg-white/10 transition-colors mb-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              Back to Admin
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-300 hover:text-white hover:bg-white/10 transition-colors mb-1"
          >
            <Building2 className="h-4 w-4" />
            View Marketplace
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-300 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
