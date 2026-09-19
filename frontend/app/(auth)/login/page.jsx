'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

function LoginContent() {
  const { login, googleLogin, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirect = searchParams.get('redirect') || null;

  useEffect(() => {
    if (!loading && user) {
      if (redirect) router.push(redirect);
      else if (user.role === 'seller') router.push('/seller/dashboard');
      else if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'buyer') router.push('/buyer/dashboard');
      else router.push('/');
    }
  }, [user, loading, router, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter email and password');
      return;
    }
    setSubmitting(true);
    try {
      const loggedUser = await login(form.email, form.password);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      if (redirect) router.push(redirect);
      else if (loggedUser.role === 'seller') router.push('/seller/dashboard');
      else if (loggedUser.role === 'admin') router.push('/admin/dashboard');
      else if (loggedUser.role === 'buyer') router.push('/buyer/dashboard');
      else router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const loggedUser = await googleLogin();
      toast.success(`Welcome, ${loggedUser.name}!`);
      if (redirect) router.push(redirect);
      else if (loggedUser.role === 'seller') router.push('/seller/dashboard');
      else if (loggedUser.role === 'admin') router.push('/admin/dashboard');
      else if (loggedUser.role === 'buyer') router.push('/buyer/dashboard');
      else router.push('/');
    } catch {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-navy-600 mb-2">
            <Building2 className="h-7 w-7 text-gold-500" />
            <span>Noah <span className="text-gold-500">Attire</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mt-1">Access your B2B marketplace dashboard</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or continue with</span></div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-md py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Sign in with Google
          </button>

          <p className="text-center text-sm text-gray-600 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-navy-600 font-semibold hover:underline">
              Register for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
