import { Heart, Flame } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { EventRatingButtons } from "./EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";

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
}: EventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const isCurrentlyFavorite = isFavorite(id);

  const isMySwitzerland = external_id?.startsWith("mys_");
  const isYearRound = availableMonths?.length === 12;

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
    <article className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-border/50">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Date Badge - Top Left */}
        {date && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            {date}
          </div>
        )}
        
        {/* Popular Badge - Below Date if exists */}
        {isPopular && (
          <div className="absolute top-12 left-3 flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase">
            <Flame size={12} /> Popular
          </div>
        )}
        
        {/* Heart Button - Top Right */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-colors"
        >
          <Heart size={18} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-white"} />
        </button>
      </div>

      {/* Content Section - Compact */}
      <div className="p-4 bg-white">
        {/* Title */}
        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 mb-1">
          {title}
        </h3>
        
        {/* Location */}
        <p className="text-xs text-muted-foreground">
          {location || venue || "Schweiz"}
        </p>
      </div>
    </article>
  );
};

export default EventCard;
