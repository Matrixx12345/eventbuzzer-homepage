import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { EventRatingButtons } from "./EventRatingButtons";
import { StarRating } from "./StarRating";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import ImageAttribution from "./ImageAttribution";
import { BuzzTracker } from "./BuzzTracker";
import { generateEventSlug } from "@/utils/eventUtilities";

interface Event {
  id: string;
  external_id?: string;
  title: string;
  venue_name?: string;
  address_city?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  image_author?: string | null;
  image_license?: string | null;
  category_sub_id?: number;
  created_at?: string;
  start_date?: string;
  buzz_score?: number | null;
  relevance_score?: number | null;
}

interface CompactEventCardProps {
  event: Event;
  onEventClick?: (event: Event) => void;
}

export const CompactEventCard = ({
  event,
  onEventClick,
}: CompactEventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const isCurrentlyFavorite = isFavorite(event.id);

  const title = event.title || "Untitled Event";
  const venue = event.venue_name || "";
  const location = event.address_city || event.location || "Schweiz";
  const image = event.image_url || "";
  const buzz_score = event.buzz_score || event.relevance_score || 75;
  const image_author = event.image_author;
  const image_license = event.image_license;
  const slug = generateEventSlug(String(title || ""), String(location || ""));

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasNotFavorite = !isCurrentlyFavorite;
    toggleFavorite({
      id: event.id,
      slug,
      title,
      venue,
      location,
      image,
      date: event.start_date
    });
    if (wasNotFavorite) {
      sendLike(event.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If onEventClick is provided, open modal instead of navigating
    if (onEventClick) {
      e.preventDefault();
      onEventClick(event);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full border border-stone-200 cursor-pointer"
    >
      {/* Image Section - 2.5:1 ultra-compact with premium treatment */}
      <div className="relative aspect-[2.5/1] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-all duration-500
                     blur-[0.3px] saturate-[1.12] contrast-[1.03] brightness-[1.03] sepia-[0.08]
                     group-hover:scale-105 group-hover:saturate-[1.18] group-hover:sepia-0 group-hover:blur-0"
        />
        {/* Subtle Vignette for premium look */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.08)] pointer-events-none" />
        
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-colors z-10"
        >
          <Heart size={18} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-white"} />
        </button>
        {/* Image Attribution - only shows on hover */}
        <ImageAttribution author={image_author} license={image_license} />
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow gap-2">
        {/* Title: Fixed 2 lines with min-height for consistent card heights */}
        <h3 className="text-lg font-semibold text-[#1a1a1a] leading-snug line-clamp-2 min-h-[3rem]">
          {title}
        </h3>

        {/* Venue */}
        <p className="text-sm text-stone-700 truncate">{venue}</p>

        {/* Location */}
        <div className="inline-flex items-center gap-1.5 text-sm text-stone-700">
          <span className="text-red-600">📍</span>
          <span>{location || "Schweiz"}</span>
        </div>

        {/* Footer: Star Rating + Buzz + Flag */}
        <div className="mt-auto pt-3 flex items-center gap-4 text-xs text-stone-600">
          {/* Star Rating */}
          <StarRating eventId={event.id} buzzScore={buzz_score} size="sm" />

          {/* Buzz Tracker - inline in footer */}
          <BuzzTracker buzzScore={buzz_score} />

          {/* Report flag icon */}
          <div className="ml-auto">
            <EventRatingButtons eventId={event.id} eventTitle={title} />
          </div>
        </div>
      </div>
    </div>
  );
};
