import {
  FileText, Lock, Truck, RotateCcw, FlaskConical, Boxes, ShieldCheck, BadgeCheck,
} from 'lucide-react';

export const metadata = {
  title: 'Policies',
  description: 'Noah Attire terms & conditions, privacy, shipping, returns, sample, MOQ, warranty, and quality assurance policies.',
};

const SECTIONS = [
  {
    id: 'terms',
    icon: FileText,
    title: 'Terms & Conditions',
    items: [
      'Orders are subject to acceptance and product availability.',
      'Custom orders require written approval before production begins.',
      'Orders cannot be cancelled once production has started.',
      'Prices are quoted in USD unless otherwise agreed.',
      'Standard payment terms are 50% advance and balance before shipment.',
      'Delivery dates are estimates and may vary due to production or shipping factors.',
      "Customer-supplied logos and artwork remain the customer's property.",
      'Liability shall not exceed the value of goods supplied.',
      'These terms are governed by the laws of Pakistan.',
    ],
  },
  {
    id: 'privacy',
    icon: Lock,
    title: 'Privacy Policy',
    items: [
      'Customer information is collected solely for business operations and order processing.',
      'Information is not sold to third parties and is only shared when necessary for logistics, payment processing, or legal compliance.',
    ],
  },
  {
    id: 'shipping',
    icon: Truck,
    title: 'Shipping Policy',
    items: [
      'Orders may be shipped by air freight, sea freight, or courier services.',
      'Customers are responsible for customs duties, VAT, and import taxes.',
      'Tracking information will be provided when available.',
    ],
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: 'Return & Refund Policy',
    items: [
      'Custom-manufactured products are generally non-refundable.',
      'Claims must be submitted within seven days of delivery with supporting evidence.',
      'Approved claims may result in replacement, repair, credit, or refund.',
    ],
  },
  {
    id: 'samples',
    icon: FlaskConical,
    title: 'Sample Policy',
    items: [
      'Samples may be charged depending on complexity and materials.',
      'Sample costs may be credited toward future bulk orders.',
      'Sample shipping charges are generally the responsibility of the customer.',
    ],
  },
  {
    id: 'moq',
    icon: Boxes,
    title: 'MOQ Policy',
    items: [
      'Minimum Order Quantities vary by product category and customization requirements.',
    ],
  },
  {
    id: 'warranty',
    icon: ShieldCheck,
    title: 'Warranty Policy',
    items: [
      'Warranty covers manufacturing defects only and excludes misuse, wear and tear, or improper care.',
    ],
  },
  {
    id: 'quality',
    icon: BadgeCheck,
    title: 'Quality Assurance',
    items: [
      'Our quality assurance process covers every stage of production, from raw material sourcing to final shipment.',
      'Each product undergoes fabric inspection, in-line quality control, performance testing, packaging verification, and pre-shipment inspection.',
      'We follow internationally recognized AQL inspection standards and maintain strict quality controls for apparel, sportswear, martial arts uniforms, workwear, safety wear, medical apparel, and leather products.',
    ],
    extra: (
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Quality Assurance Procedures</p>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm text-gray-600 list-disc list-inside">
            <li>Raw Material Inspection</li>
            <li>Pre-Production Quality Control</li>
            <li>In-Line Inspection</li>
            <li>Final Product Inspection</li>
            <li>Performance Testing</li>
            <li>Safety &amp; Compliance Testing</li>
            <li>Packaging Inspection</li>
            <li>Pre-Shipment Inspection (AQL Based)</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">AQL Inspection Standards</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium bg-red-50 text-red-700 px-2.5 py-1 rounded-full">Critical Defects: AQL 0.0</span>
            <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">Major Defects: AQL 2.5</span>
            <span className="text-xs font-medium bg-alibaba-50 text-alibaba-700 px-2.5 py-1 rounded-full">Minor Defects: AQL 4.0</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Policies</h1>
          <p className="text-gray-300 text-base">
            Terms, privacy, shipping, returns, and quality standards for Noah Attire orders
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SECTIONS.map(({ id, title }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-xs font-medium bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-alibaba-300 hover:text-alibaba-600 transition-colors"
            >
              {title}
            </a>
          ))}
        </div>

        <div className="space-y-6">
          {SECTIONS.map(({ id, icon: Icon, title, items, extra }) => (
            <section key={id} id={id} className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-alibaba-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-alibaba-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              </div>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                    <span className="text-alibaba-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {extra}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
