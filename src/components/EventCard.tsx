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
}

const EventCard = ({ id, slug, image, title, venue, location, date, isPopular = false, availableMonths, external_id }: EventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const isCurrentlyFavorite = isFavorite(id);
  
  // Only show "Ganzjährig" for MySwitzerland events with all 12 months available
  const isMySwitzerland = external_id?.startsWith('mys_');
  const isYearRound = availableMonths?.length === 12;
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasNotFavorite = !isCurrentlyFavorite;
    toggleFavorite({ id, slug, title, venue, location, image, date });
    // Send like when adding to favorites (not when removing)
    if (wasNotFavorite) {
      sendLike(id);
    }
  };

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <Flame size={14} />
            <span>POPULAR</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors"
          aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-card-foreground"}
          />
        </button>

        {/* Ticketmaster Badge */}
        {external_id?.startsWith('tm_') && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded font-bold text-sm">
            T
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{venue}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
        {/* Show "Ganzjährig" only for MySwitzerland events with all 12 months */}
        {isMySwitzerland && isYearRound && (
          <span className="text-xs text-amber-600/80 font-medium tracking-wide mt-1 block">
            Ganzjährig
          </span>
        )}
        
        {/* Rating Buttons */}
        <EventRatingButtons eventId={id} eventTitle={title} />
      </div>
    </article>
  );
};

export default EventCard;
