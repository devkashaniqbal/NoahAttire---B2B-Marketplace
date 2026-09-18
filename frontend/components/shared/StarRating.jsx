import { Star } from 'lucide-react';

// Cosmetic rating derived from id so it's stable per-product without needing a rating field in the schema.
export function ratingFromId(id) {
  if (!id) return 4.5;
  const sum = String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return Math.round((4 + (sum % 10) / 10) * 10) / 10;
}

export default function StarRating({ value = 4.5, count, className = '' }) {
  const rounded = Math.round(value);
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < rounded ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">{value.toFixed(1)}{count ? ` (${count})` : ''}</span>
    </div>
  );
}
