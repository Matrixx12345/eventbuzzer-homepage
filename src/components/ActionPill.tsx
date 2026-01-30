import { Heart, Star, ShoppingCart, Share2, Calendar } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  variant = 'light'
}: ActionPillProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(eventId);

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
      location
    });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/event/${slug || eventId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert!");
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Create Google Calendar link
    const eventTitle = encodeURIComponent(title);
    const eventLocation = encodeURIComponent(location || venue || "");
    const date = startDate ? new Date(startDate) : new Date();
    const dateStr = date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${dateStr}/${endDateStr}&location=${eventLocation}`;
    window.open(calendarUrl, '_blank');
  };

  const handleTicketClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ticketUrl) {
      window.open(ticketUrl, '_blank');
    } else {
      toast.info("Ticket-Verkauf demnächst verfügbar");
    }
  };

  // Style variants - dark is transparent with outline, light has white background
  const pillStyles = variant === 'dark'
    ? {
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        boxShadow: 'none'
      }
    : {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.04)'
      };

  const textColor = variant === 'dark' ? 'text-white/60' : 'text-gray-700';
  const iconColor = variant === 'dark' ? 'text-white/60' : 'text-gray-600';
  const dividerColor = variant === 'dark'
    ? 'bg-gradient-to-b from-transparent via-white/30 to-transparent'
    : 'bg-gradient-to-b from-transparent via-gray-300/60 to-transparent';

  // Shadow for dark variant icons to be visible on photos
  const iconShadow = variant === 'dark'
    ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }
    : {};

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        variant === 'dark' ? "gap-6 px-5 py-1" : "gap-3 px-4 py-1.5",
        className
      )}
      style={pillStyles}
    >
      {/* Star Rating */}
      <div className="flex items-center gap-1.5" style={iconShadow}>
        <Star size={14} className="text-[#fbbf24] stroke-[1.5]" />
        <span className={cn("text-sm font-semibold", textColor)}>
          {rating}
        </span>
      </div>

      {/* Divider */}
      <div className={cn("w-px h-4", dividerColor)} />

      {/* Favorit */}
      <button
        onClick={handleFavoriteClick}
        className="group/heart relative p-0.5 hover:scale-110 transition-all duration-200"
        style={iconShadow}
      >
        <Heart
          size={15}
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
      <div className={cn("w-px h-4", dividerColor)} />

      {/* Share */}
      <button
        onClick={handleShareClick}
        className="group/share relative p-0.5 hover:scale-110 transition-all duration-200"
        style={iconShadow}
      >
        <Share2 size={15} className={iconColor} />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/share:block z-50 pointer-events-none">
          <div className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
            Link teilen
          </div>
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
        </div>
      </button>

      {/* Divider */}
      <div className={cn("w-px h-4", dividerColor)} />

      {/* Ticket */}
      <button
        onClick={handleTicketClick}
        className="group/ticket relative p-0.5 hover:scale-110 transition-all duration-200"
        style={iconShadow}
      >
        <ShoppingCart size={15} className={variant === 'dark' ? "text-white/60" : "text-[#1e3a8a]"} />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/ticket:block z-50 pointer-events-none">
          <div className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
            Ticket kaufen
          </div>
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
        </div>
      </button>
    </div>
  );
};

export default ActionPill;
