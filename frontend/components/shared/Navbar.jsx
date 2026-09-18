'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Building2, ChevronDown, LogOut, LayoutDashboard, User, Search, Package, FileText, Wallet, ShoppingCart, Users, LifeBuoy, BarChart3, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    api.get('/site-settings')
      .then((res) => setLogoUrl(res.data?.settings?.logoUrl || ''))
      .catch(() => setLogoUrl(''));
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
    { href: '/policies', label: 'Policies' },
    { href: '/seller-register', label: 'Start Selling', highlight: true },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 bg-alibaba-600 border-b border-alibaba-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white flex-shrink-0">
            <span className="relative w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image src={logoUrl || '/logo-icon.png'} alt="NoahAttire" fill className="object-contain" />
            </span>
            <span>Noah <span className="text-white/80">Attire</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              link.highlight && !user ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-white border border-white/50 rounded-md px-3 py-1.5 hover:bg-white/10 transition-colors"
                >
                  {link.label}
                </Link>
              ) : !link.highlight ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-white',
                    isActive(link.href) ? 'text-white font-semibold' : 'text-white/75'
                  )}
                >
                  {link.label}
                </Link>
              ) : null
            ))}
          </nav>

          {/* Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-white/30 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50"
              />
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {loading ? (
              <div className="h-8 w-24 bg-white/20 animate-pulse rounded-md" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-alibaba-600 text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs font-medium bg-alibaba-100 text-alibaba-700 px-2 py-0.5 rounded-full capitalize">
                        {user.role}
                      </span>
                    </div>

                    {user.role === 'seller' && (
                      <Link
                        href="/seller/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Seller Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    {user.role === 'buyer' && (
                      <>
                        <Link
                          href="/buyer/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          My Dashboard
                        </Link>
                        <Link
                          href="/buyer/orders"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Link>
                        <Link
                          href="/buyer/rfqs"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FileText className="h-4 w-4" />
                          My Quote Requests
                        </Link>
                        <Link
                          href="/buyer/payments"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Wallet className="h-4 w-4" />
                          Payments
                        </Link>
                        <Link
                          href="/buyer/procurement"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Procurement
                        </Link>
                        <Link
                          href="/buyer/suppliers"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Users className="h-4 w-4" />
                          Suppliers
                        </Link>
                        <Link
                          href="/buyer/shipments"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Truck className="h-4 w-4" />
                          Shipments
                        </Link>
                        <Link
                          href="/buyer/analytics"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                        </Link>
                        <Link
                          href="/buyer/support"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LifeBuoy className="h-4 w-4" />
                          Support
                        </Link>
                        <Link
                          href="/buyer/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="h-4 w-4" />
                          Profile & Company
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" className="bg-white text-alibaba-600 hover:bg-white/90" asChild>
                  <Link href="/register">Join Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-white flex-shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            (!link.highlight || !user) && (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block text-sm font-medium py-2',
                  link.highlight ? 'text-alibaba-600 font-semibold' :
                  isActive(link.href) ? 'text-alibaba-600 font-semibold' : 'text-gray-600'
                )}
              >
                {link.label}
              </Link>
            )
          ))}
          {!loading && (
            user ? (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <p className="text-xs text-gray-500 font-medium">{user.name} · {user.role}</p>
                {user.role === 'seller' && (
                  <Link href="/seller/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                    Seller Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                    Admin Dashboard
                  </Link>
                )}
                {user.role === 'buyer' && (
                  <>
                    <Link href="/buyer/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      My Dashboard
                    </Link>
                    <Link href="/buyer/orders" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      My Orders
                    </Link>
                    <Link href="/buyer/rfqs" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      My Quote Requests
                    </Link>
                    <Link href="/buyer/payments" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      Payments
                    </Link>
                    <Link href="/buyer/procurement" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      Procurement
                    </Link>
                    <Link href="/buyer/suppliers" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      Suppliers
                    </Link>
                    <Link href="/buyer/shipments" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      Shipments
                    </Link>
                    <Link href="/buyer/analytics" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      Analytics
                    </Link>
                    <Link href="/buyer/support" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      Support
                    </Link>
                    <Link href="/buyer/profile" onClick={() => setMobileOpen(false)} className="block text-sm text-alibaba-600 font-medium py-1">
                      Profile & Company
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} className="block text-sm text-red-600 font-medium py-1">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button variant="primary-outline" size="sm" className="flex-1" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                </Button>
                <Button variant="primary" size="sm" className="flex-1" asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>Join Free</Link>
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {/* Close dropdown on outside click */}
      {profileOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
      )}
    </header>
  );
}
