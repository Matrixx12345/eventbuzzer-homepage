import { Heart, Star, Briefcase, Share2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTripPlanner } from "@/contexts/TripPlannerContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Event } from "@/hooks/useEventData";

interface ActionPillProps {
  eventId: string;
  slug?: string;
  image?: string;
  title: string;
  venue?: string;
  location?: string;
  buzzScore?: number | null;
  ticketUrl?: string;
  startDate?: string;
  className?: string;
  variant?: 'light' | 'dark'; // 'dark' for cards with dark backgrounds
  event?: Event; // Optional: full event object for trip planner
}

/**
 * Glassmorphism Action Pill - Brand-consistent UI element
 * Features: Star Rating, Favorite, Share, Calendar, Ticket
 */
export const ActionPill = ({
  eventId,
  slug,
  image,
  title,
  venue = "",
  location = "",
  buzzScore,
  ticketUrl,
  startDate,
  className,
  variant = 'light',
  event
}: ActionPillProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInTrip, addEventToDay, removeEventFromTrip } = useTripPlanner();
  const isCurrentlyFavorite = isFavorite(eventId);
  const isCurrentlyInTrip = isInTrip(eventId);

  // Convert buzz score (0-100) to rating (0-5)
  const score = buzzScore ?? 50;
  const rating = Math.min(5, Math.max(0, score / 20)).toFixed(1);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: eventId,
      slug,
      image,
      title,
      venue,
      location,
      date: startDate || ""
    });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/event/${slug || eventId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert!");
  };

  const handleTripPlannerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentlyInTrip) {
      // Remove from trip
      removeEventFromTrip(eventId);
      toast.success("Aus Trip Planner entfernt");
    } else {
      // Add to trip - construct Event object if not provided
      const eventObj: Event = event || {
        id: eventId,
        external_id: slug,
        title,
        image_url: image,
        location,
        venue_name: venue,
        buzz_score: buzzScore,
        ticket_url: ticketUrl,
        start_date: startDate,
      };

      addEventToDay(eventObj);
      toast.success("Zu Trip Planner hinzugefügt");
    }
  };

  // Style variants - dark is transparent with outline, light has glassmorphism
  const pillStyles = variant === 'dark'
    ? {
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        boxShadow: 'none'
      }
    : {
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
      };

  const textColor = variant === 'dark' ? 'text-white/60' : 'text-gray-700';
  const iconColor = variant === 'dark' ? 'text-white/60' : 'text-gray-600';

  // Shadow for dark variant icons to be visible on photos
  const iconShadow = variant === 'dark'
    ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }
    : {};

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-full w-full",
        variant === 'dark' ? "px-6 py-2.5" : "px-6 py-2",
        className
      )}
      style={pillStyles}
    >
      {/* Star Rating */}
      <div className="flex items-center gap-1.5" style={iconShadow}>
        <Star size={16} className="text-[#fbbf24] stroke-[1.5]" />
        <span className={cn("text-sm font-semibold", textColor)}>
          {rating}
        </span>
      </div>

      {/* Divider */}
      <div className={cn("w-px h-4", variant === 'dark' ? "bg-gradient-to-b from-transparent via-white/40 to-transparent" : "bg-gradient-to-b from-transparent via-gray-400/40 to-transparent")} />

      {/* Favorit */}
      <button
        onClick={handleFavoriteClick}
        className="group/heart relative p-1 hover:scale-110 transition-all duration-200"
        style={iconShadow}
      >
        <Heart
          size={18}
          className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : iconColor}
        />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/heart:block z-50 pointer-events-none">
          <div className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
            {isCurrentlyFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          </div>
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
        </div>
      </button>

      {/* Divider */}
      <div className={cn("w-px h-4", variant === 'dark' ? "bg-gradient-to-b from-transparent via-white/40 to-transparent" : "bg-gradient-to-b from-transparent via-gray-400/40 to-transparent")} />

      {/* Share */}
      <button
        onClick={handleShareClick}
        className="group/share relative p-1 hover:scale-110 transition-all duration-200"
        style={iconShadow}
      >
        <Share2 size={18} className={iconColor} />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/share:block z-50 pointer-events-none">
          <div className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
            Link teilen
          </div>
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
        </div>
      </button>

      {/* Divider */}
      <div className={cn("w-px h-4", variant === 'dark' ? "bg-gradient-to-b from-transparent via-white/40 to-transparent" : "bg-gradient-to-b from-transparent via-gray-400/40 to-transparent")} />

      {/* Trip Planner */}
      <button
        onClick={handleTripPlannerClick}
        className="group/trip relative p-1 hover:scale-110 transition-all duration-200"
        style={iconShadow}
      >
        <Briefcase
          size={18}
          className={cn(
            "transition-colors duration-200",
            isCurrentlyInTrip ? "fill-blue-500 text-blue-500" : iconColor
          )}
        />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/trip:block z-50 pointer-events-none">
          <div className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
            {isCurrentlyInTrip ? "Aus Trip Planner entfernen" : "Zu Trip Planner hinzufügen"}
          </div>
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
        </div>
      </button>
    </div>
  );
};

export default ActionPill;
