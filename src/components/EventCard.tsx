import { Heart, Flame } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { EventRatingButtons } from "./EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import ImageAttribution from "./ImageAttribution";

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
}: EventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const isCurrentlyFavorite = isFavorite(id);

  const isMySwitzerland = external_id?.startsWith("mys_");
  const isYearRound = availableMonths?.length === 12;
  // Check if museum: either by category_sub_id OR by external_id pattern (manual_ entries are museums)
  const isMuseum = category_sub_id === 'museum-kunst' || external_id?.startsWith('manual_');

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasNotFavorite = !isCurrentlyFavorite;
    toggleFavorite({ id, slug, title, venue, location, image, date });
    if (wasNotFavorite) {
      sendLike(id);
    }
  };

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {isPopular && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase">
            <Flame size={12} /> Popular
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-colors"
        >
          <Heart size={18} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-white"} />
        </button>
        {/* Image Attribution - only shows on hover */}
        <ImageAttribution author={image_author} license={image_license} />
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow gap-2">
        {/* Title: Fixed 2 lines with min-height for consistent card heights */}
        <h3 className="text-[15px] font-bold text-card-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>

        {/* Venue */}
        <p className="text-[12px] text-muted-foreground truncate opacity-80">{venue}</p>

        {/* Location with Mini-Map Hover Tooltip */}
        <div className="group/map relative inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 cursor-help w-fit mt-1">
          <span className="text-red-500 animate-pulse">📍</span>
          <span className="border-b border-dotted border-gray-400 group-hover/map:text-red-600 transition-colors">
            {location || "Schweiz"}
          </span>

          {/* Mini-Map Tooltip */}
          <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
            <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-44 h-32 overflow-hidden">
              <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                {/* Swiss Outline SVG Background */}
                <img 
                  src="/swiss-outline.svg" 
                  className="w-full h-full object-contain opacity-30 p-2" 
                  alt="Switzerland Map" 
                />
                {/* Dynamic Red Pin based on lat/lng */}
                {latitude && longitude && (
                  <div
                    className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md animate-bounce"
                    style={{
                      // Map Swiss coordinates to SVG position
                      // Switzerland bounds: lat 45.8-47.8, lng 5.9-10.5
                      left: `${((longitude - 5.9) / (10.5 - 5.9)) * 100}%`,
                      top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
            {/* Tooltip Arrow */}
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
          </div>
        </div>

        {/* Footer with Badge and Rating */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          {isMuseum ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Museum
            </span>
          ) : isMySwitzerland && isYearRound ? (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Ganzjährig
            </span>
          ) : null}
          <EventRatingButtons eventId={id} eventTitle={title} />
        </div>
      </div>
    </article>
  );
};

export default EventCard;
