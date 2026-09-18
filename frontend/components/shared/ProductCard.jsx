'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InquiryForm from '@/components/shared/InquiryForm';
import { useAuth } from '@/context/AuthContext';
import { Package, ImageIcon, MessageSquare } from 'lucide-react';
import { CATEGORY_ICONS } from '@/lib/utils';
import toast from 'react-hot-toast';

function CategoryIcon({ category, className }) {
  const Icon = CATEGORY_ICONS[category] || Package;
  return <Icon className={className} />;
}

export default function ProductCard({ product }) {
  const { _id, title, images = [], category, minOrderQty } = product;
  const categories = Array.isArray(category) ? category : [category].filter(Boolean);
  const primaryCategory = categories[0];
  const hasImages = images.length > 0;
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
        {/* Clickable image + content area */}
        <Link href={`/products/${_id}`} className="flex flex-col flex-1">
          {/* Image */}
          <div className="relative aspect-square bg-gray-50 overflow-hidden flex-shrink-0">
            {hasImages ? (
              <Image
                src={images[0]}
                alt={title}
                fill
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('[data-fallback]');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}

            {/* Fallback when no image or image errors */}
            <div
              data-fallback
              className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-gray-50 to-gray-100 ${hasImages ? 'hidden' : ''}`}
            >
              <CategoryIcon category={primaryCategory} className="h-12 w-12 text-gray-300" />
              <span className="text-xs text-gray-400 font-medium">{primaryCategory}</span>
            </div>

            {/* Image count */}
            {images.length > 1 && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/55 text-white text-[11px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                <ImageIcon className="h-3 w-3" />
                {images.length}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-alibaba-600 transition-colors line-clamp-2 min-h-[2.5em]">
              {title}
            </h3>

            {minOrderQty && (
              <div className="flex items-center text-xs text-gray-500 mt-auto pt-2.5 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  MOQ: {minOrderQty}
                </span>
              </div>
            )}
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

      {/* Inquiry Dialog */}
      {!isSeller && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-navy-600">Send Inquiry to Seller</DialogTitle>
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
