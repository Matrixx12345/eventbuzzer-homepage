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
  latitude?: number; // Wichtig für den Pin
  longitude?: number; // Wichtig für den Pin
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
    <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {isPopular && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <Flame size={14} />
            <span>POPULAR</span>
          </div>
        )}

        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors"
          aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={20} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-card-foreground"} />
        </button>

        {external_id?.startsWith("tm_") && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded font-bold text-sm">T</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1">
        {/* TITEL: Fixiert auf 2 Zeilen (line-clamp-2) */}
        <h3 className="text-[15px] font-bold text-card-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>

        <p className="text-[13px] text-muted-foreground truncate">{venue}</p>

        {/* LOCATION: Mit Mini-Map Hover Effekt */}
        <div className="group/map relative inline-flex items-center gap-1 text-[13px] text-muted-foreground cursor-help w-fit">
          <span className="text-red-500 text-xs">📍</span>
          <span className="border-b border-dotted border-muted-foreground/50 hover:text-red-600 transition-colors">
            {location || "Schweiz"}
          </span>

          {/* DAS MINI-MAP TOOLTIP (Erscheint nur beim Drüberfahren) */}
          <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
            <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-40 h-28 overflow-hidden flex items-center justify-center">
              <div className="relative w-full h-full">
                <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                {/* Roter Pin: Erscheint nur wenn Koordinaten da sind */}
                {latitude && longitude && (
                  <div
                    className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm shadow-black/50"
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

        {isMySwitzerland && isYearRound && (
          <span className="text-[11px] text-amber-600/80 font-semibold tracking-wide uppercase mt-1">Ganzjährig</span>
        )}

        <div className="mt-2">
          <EventRatingButtons eventId={id} eventTitle={title} />
        </div>
      </div>
    </article>
  );
};

export default EventCard;
