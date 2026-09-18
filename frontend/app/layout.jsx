import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import SiteChrome from '@/components/shared/SiteChrome';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'Noah Attire — Apparel Manufacturer & Exporter',
    template: '%s | Noah Attire',
  },
  description:
    'Noah Attire is a leading manufacturer and exporter of apparel, sportswear, workwear, safety wear, and leather products, based in Sialkot, Pakistan.',
  keywords: ['apparel manufacturer', 'sportswear exporter', 'workwear', 'leather products', 'Sialkot', 'wholesale clothing'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <SiteChrome>{children}</SiteChrome>
          </div>
        </Providers>
      </body>
    </html>
  );
}
