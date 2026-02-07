/**
 * SimilarEventCard - Compact Design with Distance (Backup v1)
 *
 * Created: 2026-01-29
 * Used in: EventDetail.tsx - "In der Nähe" section
 *
 * Features:
 * - Compact card with image, title, description, location + distance
 * - font-sans font-semibold for title (matches EventList1)
 * - Single line title (line-clamp-1)
 * - 2-line description (line-clamp-2)
 * - Location with distance: "Davos, 22 km entfernt"
 * - Hover effects: shadow + image zoom
 * - Click to swap event (stays on EventDetail page)
 */

import { ArrowRight } from "lucide-react";

interface SimilarEventCardProps {
  slug: string;
  image: string;
  title: string;
  description?: string;
  location: string;
  distance?: string;
  onSwap: (slug: string) => void;
}

const SimilarEventCard = ({ slug, image, title, description, location, distance, onSwap }: SimilarEventCardProps) => {
  const handleClick = () => {
    onSwap(slug);
  };

  return (
    <button onClick={handleClick} className="block group h-full w-full text-left">
      <article className="bg-white rounded-xl overflow-hidden h-full border border-neutral-200 hover:shadow-lg transition-shadow duration-300">
        {/* Image - 16:9 Landscape */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-sans text-neutral-900 text-sm font-semibold leading-tight line-clamp-1 mb-1">{title}</h3>
          {description && (
            <p className="text-neutral-500 text-xs line-clamp-2 mb-2">{description}</p>
          )}
          <p className="text-neutral-400 text-xs">
            {location}{distance ? `, ${distance} entfernt` : ''}
          </p>
        </div>
      </article>
    </button>
  );
};

export default SimilarEventCard;
