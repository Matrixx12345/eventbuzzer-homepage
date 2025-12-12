import { Heart, Flame, Check, Clock } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Badge } from "@/components/ui/badge";

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

// Helper to get season name from months array
const getSeasonName = (months: number[]): string => {
  if (!months || months.length === 0) return "Prüfe Verfügbarkeit";
  
  const hasWinter = [11, 12, 1, 2, 3].some(m => months.includes(m));
  const hasSummer = [6, 7, 8].some(m => months.includes(m));
  
  if (hasWinter && !hasSummer) return "Winter";
  if (hasSummer && !hasWinter) return "Sommer";
  if (months.length <= 3) {
    const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return months.map(m => monthNames[m - 1]).join(", ");
  }
  
  return "Prüfe Verfügbarkeit";
};

const EventCard = ({ id, slug, image, title, venue, location, date, isPopular = false, availableMonths, external_id }: EventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(id);
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Only show availability badges for MySwitzerland events
  const isMySwitzerland = external_id?.startsWith('mys_');
  const isYearRound = availableMonths?.length === 12;
  const isAvailableNow = availableMonths?.includes(currentMonth);
  const isSeasonal = availableMonths && availableMonths.length > 0 && availableMonths.length < 12;

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

        {/* Availability Badge - only for MySwitzerland events */}
        {isMySwitzerland && availableMonths && availableMonths.length > 0 && (
          <div className={`absolute ${isPopular ? 'top-12' : 'top-3'} left-3`}>
            {isYearRound ? (
              <Badge variant="secondary" className="backdrop-blur-sm border-0 text-xs">
                <Check size={12} className="mr-1" />
                Ganzjährig
              </Badge>
            ) : isAvailableNow ? (
              <Badge variant="success" className="backdrop-blur-sm border-0 text-xs">
                <Check size={12} className="mr-1" />
                Verfügbar
              </Badge>
            ) : isSeasonal ? (
              <Badge variant="warning" className="backdrop-blur-sm border-0 text-xs">
                <Clock size={12} className="mr-1" />
                {getSeasonName(availableMonths)}
              </Badge>
            ) : null}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite({ id, slug, title, venue, location, image, date });
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors"
          aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-card-foreground"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{venue}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
      </div>
    </article>
  );
};

export default EventCard;
