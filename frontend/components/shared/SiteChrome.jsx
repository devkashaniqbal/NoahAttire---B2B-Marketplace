'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

// Admin and seller portals have their own sidebar + branding, so the
// marketing-site navbar/footer would just duplicate navigation there.
const HIDE_CHROME_PREFIXES = ['/admin', '/seller'];

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const hideChrome = HIDE_CHROME_PREFIXES.some((p) => pathname.startsWith(p));

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
