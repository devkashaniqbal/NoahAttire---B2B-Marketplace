import Link from 'next/link';
import Image from 'next/image';
import { Package, BadgeCheck } from 'lucide-react';
import StarRating, { ratingFromId } from '@/components/shared/StarRating';
import { CATEGORY_ICONS } from '@/lib/utils';

export default function DealProductCard({ product }) {
  const { _id, title, images = [], category, priceRange, brandName, sellerId } = product;
  const primaryCategory = Array.isArray(category) ? category[0] : category;
  const brand = brandName || (typeof sellerId === 'object' ? sellerId?.name : null);
  const hasImages = images.length > 0;
  const Icon = CATEGORY_ICONS[primaryCategory] || Package;

  return (
    <Link
      href={`/products/${_id}`}
      className="group bg-white rounded-2xl border border-gray-200/80 hover:shadow-xl hover:shadow-gray-200/60 hover:border-alibaba-200 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square bg-gray-50 flex-shrink-0">
        {hasImages ? (
          <Image
            src={images[0]}
            alt={title}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-14 w-14 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5em] group-hover:text-alibaba-600 transition-colors">
          {title}
        </h3>
        <StarRating value={ratingFromId(_id)} />

        {brand && (
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-auto pt-1">
            <BadgeCheck className="h-3.5 w-3.5 text-alibaba-500 flex-shrink-0" />
            Sold by <span className="font-medium text-gray-700 truncate">{brand}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
