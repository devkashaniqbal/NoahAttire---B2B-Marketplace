import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Factory, Users, Award, Globe2, CheckCircle2, Target, Eye, ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'About Us',
  description: 'Noah Attire — leading manufacturer and exporter of apparel, sportswear, workwear, safety wear, and leather products based in Sialkot, Pakistan.',
};

const WHY_CHOOSE_US = [
  'Highly Trained Professionals and Skilled Workforce',
  'Modern Manufacturing Facility',
  'More Than 280 Specialized Machines',
  'OEM, ODM & Private Label Manufacturing',
  'Premium Quality Standards',
  'Strict Quality Control System',
  'Competitive Pricing',
  'Flexible Production Capacity',
  'Custom Design & Development Services',
  'Timely Delivery & Global Shipping',
  'Experienced Export Management Team',
  'Dedicated Customer Support',
  'Long-Term Business Partnerships',
  'Commitment to Innovation and Excellence',
];

const STATS = [
  { label: 'Specialized Machines', value: '280+', icon: Factory },
  { label: 'Export Markets', value: '6+', icon: Globe2 },
  { label: 'Product Categories', value: '20+', icon: Award },
  { label: 'Skilled Workforce', value: '100%', icon: Users },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-900 to-alibaba-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <span className="inline-block bg-amber-400 text-gray-900 text-xs font-bold tracking-wide px-3 py-1 rounded-full mb-4">
            ABOUT NOAH ATTIRE
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Manufacturer &amp; Exporter of Premium Apparel
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto">
            Based in Sialkot, Pakistan — delivering apparel, sportswear, workwear, safety wear,
            leather products, championship belts, and custom promotional merchandise worldwide.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Icon className="h-6 w-6 text-alibaba-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Who We Are</h2>
          <p className="text-gray-600 leading-relaxed">
            Noah Attire is a leading manufacturer and exporter of high-quality apparel, sportswear,
            workwear, safety wear, leather products, championship belts, and custom promotional
            merchandise. Based in Sialkot, Pakistan, we are committed to delivering premium products
            that meet international standards of quality, comfort, durability, and performance. With
            state-of-the-art manufacturing facilities and more than 280 specialized machines, Noah
            Attire is supported by a team of highly trained professionals, skilled craftsmen,
            experienced technicians, quality control specialists, and dedicated production workers.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Our workforce combines technical expertise with years of industry experience to ensure
            exceptional product quality and consistency. We provide complete OEM, ODM, and
            private-label manufacturing solutions for brands, wholesalers, distributors, retailers, and
            corporate buyers worldwide. From concept development and sampling to bulk production
            and global shipping, our team manages every stage of the manufacturing process with
            precision and efficiency.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Our diverse product portfolio includes men&apos;s, women&apos;s, and kids&apos; apparel,
            sportswear, martial arts uniforms, workwear and uniforms, medical apparel, safety wear,
            motorcycle apparel, tactical and outdoor wear, hunting and fishing apparel, leather
            products, championship belts, rainwear, denim wear, pet apparel, and promotional
            merchandise. We proudly serve customers across North America, Europe, Australia, New
            Zealand, the Middle East, and other international markets, building long-term partnerships
            based on trust, reliability, professionalism, and excellence.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-10 h-10 rounded-lg bg-alibaba-50 flex items-center justify-center mb-3">
              <Target className="h-5 w-5 text-alibaba-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Our Mission</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              To provide innovative, high-quality apparel and manufacturing solutions that empower
              businesses and brands to succeed in competitive global markets.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-10 h-10 rounded-lg bg-alibaba-50 flex items-center justify-center mb-3">
              <Eye className="h-5 w-5 text-alibaba-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Our Vision</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              To become a globally recognized manufacturing and export partner known for exceptional
              quality, innovation, reliability, and customer satisfaction.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Why Choose Noah Attire?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {WHY_CHOOSE_US.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-alibaba-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ready to Partner With Us?</h2>
          <p className="text-gray-300 text-sm mb-5 max-w-lg mx-auto">
            Browse our product catalog or get in touch to discuss OEM, ODM, and private-label
            manufacturing for your brand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" size="lg" asChild>
              <Link href="/products">Browse Products <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/policies">View Our Policies</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
