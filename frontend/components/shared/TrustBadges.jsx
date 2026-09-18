import { ShieldCheck, Truck, RotateCcw, BadgeDollarSign, Users, Headphones } from 'lucide-react';

const ITEMS = [
  { icon: ShieldCheck, title: '100% Verified', subtitle: 'Genuine suppliers' },
  { icon: Truck, title: 'Fast Delivery', subtitle: 'Nationwide shipping' },
  { icon: RotateCcw, title: 'Easy Returns', subtitle: '7-day return policy' },
  { icon: BadgeDollarSign, title: 'Money Back', subtitle: '100% guarantee' },
  { icon: Users, title: 'Trusted Platform', subtitle: 'By thousands of buyers' },
  { icon: Headphones, title: '24/7 Support', subtitle: 'Dedicated assistance' },
];

// Duplicate items for seamless infinite loop
const TRACK = [...ITEMS, ...ITEMS];

export default function TrustBadges() {
  return (
    <section className="bg-white border-t border-gray-200 py-10 overflow-hidden">
      <div className="marquee-track">
        {TRACK.map(({ icon: Icon, title, subtitle }, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center gap-2 px-10 min-w-[160px]"
          >
            <div className="w-14 h-14 rounded-full bg-alibaba-50 flex items-center justify-center">
              <Icon className="h-7 w-7 text-alibaba-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{title}</p>
            <p className="text-xs text-gray-400 whitespace-nowrap">{subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
