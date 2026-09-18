'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InquiryForm from '@/components/shared/InquiryForm';
import { useAuth } from '@/context/AuthContext';
import { CATEGORY_ICONS } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BestSellingCard({ product }) {
  const { _id, title, images = [], category, priceRange } = product;
  const primaryCategory = Array.isArray(category) ? category[0] : category;
  const hasImages = images.length > 0;
  const Icon = CATEGORY_ICONS[primaryCategory] || Package;
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleEnquire = () => {
    if (!user) {
      router.push(`/register?role=buyer&redirect=/products/${_id}`);
      return;
    }
    if (user.role === 'seller') {
      toast.error('Seller accounts cannot send inquiries');
      return;
    }
    setDialogOpen(true);
  };

  const isSeller = user?.role === 'seller';

  return (
    <>
      <div className="group flex flex-col bg-white rounded-2xl border border-gray-200/80 hover:shadow-xl hover:shadow-gray-200/60 hover:border-alibaba-200 transition-all duration-300 overflow-hidden">
        <Link href={`/products/${_id}`} className="flex flex-col flex-1">
          <div className="relative aspect-square bg-gray-50 flex-shrink-0">
            {hasImages ? (
              <Image
                src={images[0]}
                alt={title}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, 20vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5em] group-hover:text-alibaba-600 transition-colors">
              {title}
            </h3>
          </div>
        </Link>

        {/* Enquire button — hidden until card is hovered; not shown to sellers */}
        {!isSeller && (
          <div className="px-3 pb-3 sm:px-4 sm:pb-4 overflow-hidden">
            <button
              onClick={handleEnquire}
              className="w-full flex items-center justify-center gap-2 bg-alibaba-600 hover:bg-alibaba-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <MessageSquare className="h-4 w-4" />
              Enquire Now
            </button>
          </div>
        )}
      </div>

      {!isSeller && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Inquiry to Seller</DialogTitle>
            </DialogHeader>
            <InquiryForm
              productId={_id}
              productTitle={title}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
