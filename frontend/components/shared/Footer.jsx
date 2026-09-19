'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import api from '@/lib/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data?.tree || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <span className="relative w-8 h-8 flex-shrink-0">
                <Image src="/logo-icon.png" alt="NoahAttire" fill className="object-contain" />
              </span>
              <span>Noah <span className="text-alibaba-400">Attire</span></span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Leading manufacturer and exporter of apparel, sportswear, workwear, safety wear,
              leather products, and custom merchandise — based in Sialkot, Pakistan.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
              Categories
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/products" className="hover:text-gold-400 transition-colors">Browse Products</Link></li>
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="hover:text-gold-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-gold-400 transition-colors">About Us</Link></li>
              <li><Link href="/policies" className="hover:text-gold-400 transition-colors">Policies</Link></li>
              <li><Link href="/register" className="hover:text-gold-400 transition-colors">Start Selling</Link></li>
              <li><Link href="/register?role=buyer" className="hover:text-gold-400 transition-colors">Register as Buyer</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold-500 flex-shrink-0" />
                <span>Noahattire@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold-500 flex-shrink-0" />
                <span>+92 321 7198181</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <span>Sialkot, Pakistan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © {currentYear} Noah Attire. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/policies#privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/policies#terms" className="hover:text-gray-300 transition-colors">Terms &amp; Conditions</Link>
            <Link href="/policies#shipping" className="hover:text-gray-300 transition-colors">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
