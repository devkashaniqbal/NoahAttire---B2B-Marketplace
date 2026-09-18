'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, Loader2, Eye, EyeOff,
  CheckCircle, Globe, TrendingUp, ShieldCheck, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BENEFITS = [
  { icon: Globe, title: 'Global Reach', desc: 'Connect with buyers from 50+ countries actively sourcing your products.' },
  { icon: TrendingUp, title: 'Free to List', desc: 'Create unlimited product listings at no cost. Pay nothing until you grow.' },
  { icon: ShieldCheck, title: 'Verified Badge', desc: 'Get a verified seller badge that builds buyer trust instantly.' },
  { icon: Zap, title: 'Instant Inquiries', desc: 'Receive buyer inquiries directly in your dashboard with email notifications.' },
];

export default function SellerRegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'seller') router.push('/seller/onboarding');
      else router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await register({ ...form, role: 'seller' });
      toast.success('Account created! Let\'s set up your store.');
      router.push('/seller/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left: Benefits */}
          <div className="lg:pt-6">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-navy-600 mb-8">
              <Building2 className="h-7 w-7 text-gold-500" />
              <span>Noah <span className="text-gold-500">Attire</span></span>
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold text-navy-600 leading-tight mb-4">
              Start Selling to<br />
              <span className="text-gold-500">Global Buyers</span> Today
            </h1>
            <p className="text-gray-500 text-lg mb-8">
              Join thousands of suppliers growing their export business on Noah Attire. Free to start, no commission.
            </p>

            <div className="space-y-5">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-navy-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 bg-navy-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                <span className="font-semibold text-sm">What happens next?</span>
              </div>
              <ol className="space-y-2 text-sm text-navy-200">
                {[
                  'Create your free seller account (30 seconds)',
                  'Set up your business profile & logo',
                  'List your products with photos & pricing',
                  'Start receiving buyer inquiries',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-gold-500 rounded-full text-xs flex items-center justify-center font-bold text-white flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Create your seller account</h2>
              <p className="text-sm text-gray-500 mb-6">Free forever — no credit card required</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Business Email</Label>
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
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      required
                      autoComplete="new-password"
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
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</>
                  ) : (
                    'Create Seller Account — Free'
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                By registering you agree to our Terms of Service and Privacy Policy.
              </p>

              <div className="mt-5 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-navy-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Looking to buy?{' '}
                  <Link href="/register" className="text-navy-600 hover:underline">
                    Register as a buyer
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
