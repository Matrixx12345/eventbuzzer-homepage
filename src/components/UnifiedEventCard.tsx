import { Heart, MapPin } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import BuzzTracker from "@/components/BuzzTracker";
import QuickHideButton from "@/components/QuickHideButton";

interface UnifiedEventCardProps {
  id: string;
  image: string;
  title: string;
  location: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  buzzScore?: number | null;
  externalId?: string;
  onBuzzChange?: (newScore: number) => void;
  onClick?: () => void;
  onHide?: () => void;
}

const UnifiedEventCard = ({
  id,
  image,
  title,
  location,
  slug,
  latitude,
  longitude,
  buzzScore,
  externalId,
  onBuzzChange,
  onClick,
  onHide
}: UnifiedEventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(id);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id,
      slug: slug || id,
      image,
      title,
      venue: "",
      location
    });
  };
  
  return (
    <div onClick={handleClick} className="block h-full cursor-pointer group">
      <article className="relative aspect-square rounded-xl overflow-hidden bg-white border border-border shadow-sm hover:shadow-md transition-all duration-300">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* QuickHideButton */}
          {externalId && onHide && (
            <QuickHideButton externalId={externalId} onHide={onHide} />
          )}
        </div>

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick} 
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10" 
          aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={18} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-foreground/60"} />
        </button>

        {/* Content - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif text-white text-lg font-semibold leading-tight mb-1 line-clamp-2">
            {title}
          </h3>
          
          {/* Location */}
          <div className="flex items-center gap-1 text-white/80 text-sm mb-2">
            <MapPin size={12} />
            <span className="truncate">{location}</span>
          </div>

          {/* BuzzTracker */}
          <BuzzTracker 
            buzzScore={buzzScore} 
            editable={true}
            eventId={id}
            externalId={externalId}
            onBuzzChange={onBuzzChange}
          />
        </div>
      </article>
    </div>
  );
};

export default UnifiedEventCard;
