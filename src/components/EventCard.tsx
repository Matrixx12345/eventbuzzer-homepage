import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { EventRatingButtons } from "./EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import ImageAttribution from "./ImageAttribution";
import { BuzzTracker } from "./BuzzTracker";
import { trackEventClick } from "@/services/buzzTracking";

interface EventCardProps {
  id: string;
  slug: string;
  image: string;
  title: string;
  venue: string;
  location: string;
  date?: string;
  isPopular?: boolean;
  availableMonths?: number[];
  external_id?: string;
  latitude?: number;
  longitude?: number;
  image_author?: string | null;
  image_license?: string | null;
  category_sub_id?: string;
  created_at?: string;
  buzz_score?: number | null;
}

const EventCard = ({
  id,
  slug,
  image,
  title,
  venue,
  location,
  date,
  isPopular = false,
  availableMonths,
  external_id,
  latitude,
  longitude,
  image_author,
  image_license,
  category_sub_id,
  created_at,
  buzz_score,
}: EventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const isCurrentlyFavorite = isFavorite(id);

  const isMySwitzerland = external_id?.startsWith("mys_");

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasNotFavorite = !isCurrentlyFavorite;
    toggleFavorite({ id, slug, title, venue, location, image, date });
    if (wasNotFavorite) {
      sendLike(id);
    }
  };

  const handleCardClick = () => {
    // Track click silently (fire-and-forget)
    trackEventClick(id);
  };

  return (
    <article 
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

        {/* Location with Mini-Map Hover Tooltip */}
        <div className="group/map relative inline-flex items-center gap-1.5 text-sm text-stone-700 cursor-help w-fit">
          <span className="text-red-600">📍</span>
          <span className="border-b border-dotted border-stone-400 group-hover/map:text-stone-800 transition-colors">
            {location || "Schweiz"}
          </span>

          {/* Mini-Map Tooltip */}
          <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
            <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-44 h-32 overflow-hidden">
              <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                <img 
                  src="/swiss-outline.svg" 
                  className="w-full h-full object-contain opacity-30 p-2" 
                  alt="Switzerland Map" 
                />
                {latitude && longitude && (
                  <div
                    className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md animate-bounce"
                    style={{
                      left: `${((longitude - 5.9) / (10.5 - 5.9)) * 100}%`,
                      top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
          </div>
        </div>

        {/* Footer: Price indicator + Buzz + Rating */}
        <div className="mt-auto pt-3 flex items-center gap-8 text-xs text-stone-600">
          {/* Price indicator */}
          <span className="text-sm font-medium text-stone-600">$</span>
          
          {/* Buzz Tracker - inline in footer */}
          <BuzzTracker buzzScore={buzz_score} />
          
          {/* Rating flag icon */}
          <div className="ml-auto">
            <EventRatingButtons eventId={id} eventTitle={title} />
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
