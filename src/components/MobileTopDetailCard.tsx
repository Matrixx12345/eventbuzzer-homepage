import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent as DrawerContentPrimitive } from '@/components/ui/drawer';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X, MapPin, Heart, Star, ShoppingCart, Briefcase, CheckCircle, ChevronDown, Share2, Copy, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTripPlanner } from '@/contexts/TripPlannerContext';
import { getEventLocation, generateEventSlug } from '@/utils/eventUtilities';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface MobileTopDetailCardProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

// Custom DrawerContent without the automatic drag handle
const CustomDrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <>
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 z-50 flex h-auto flex-col bg-background",
        "data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:rounded-b-[16px]",
        className,
      )}
      {...props}
    >
      {children}
    </DrawerPrimitive.Content>
  </>
));
CustomDrawerContent.displayName = "CustomDrawerContent";

export const MobileTopDetailCard: React.FC<MobileTopDetailCardProps> = ({
  event,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { isInTrip, addEventToDay, removeEventFromTrip } = useTripPlanner();
  const [isFavorited, setIsFavorited] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const isCurrentlyInTrip = event ? isInTrip(event.id) : false;

  // Generate SEO slug for share links - safely handle errors
  let seoSlug = 'event';
  try {
    if (event?.id) {
      const eventTitle = event.title || 'event';
      // MUST match sitemap generation: address_city || location
      const eventLocation = event.address_city || event.location || 'schweiz';
      seoSlug = generateEventSlug(eventTitle, eventLocation);
    }
  } catch (err) {
    console.error('Error generating event slug:', err);
    seoSlug = event?.id ? String(event.id) : 'event';
  }

  // Handle swipe gestures for expand/collapse
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;

    // Swipe up = expand (difference > 50px)
    if (diff > 50 && !isExpanded) {
      setIsExpanded(true);
    }
    // Swipe down = collapse (difference < -50px)
    else if (diff < -50 && isExpanded) {
      setIsExpanded(false);
    }

    setTouchStart(0);
  };

  // Load user's existing rating
  useEffect(() => {
    try {
      if (!isOpen || !event?.id) return;
      const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
      setUserRating(ratings[event.id] || null);
    } catch (err) {
      console.error('Error loading ratings:', err);
    }
  }, [isOpen, event?.id]);

  // Reset expanded state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen]);

  // Handle rating submission
  const handleRating = (rating: number) => {
    try {
      if (!event?.id) return;
      const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
      ratings[event.id] = rating;
      localStorage.setItem('eventRatings', JSON.stringify(ratings));
      setUserRating(rating);
      setShowRatingPopup(false);
      setShowRatingSuccess(true);
      setTimeout(() => setShowRatingSuccess(false), 2000);
      toast.success(`Danke für deine Bewertung! ⭐ ${rating}/5`, { duration: 2000, position: "top-center" });
    } catch (err) {
      console.error('Error in handleRating:', err);
      toast.error('Bewertung konnte nicht gespeichert werden');
    }
  };

  const handleFavoriteClick = () => {
    try {
      if (!event?.id) return;
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Error in handleFavoriteClick:', err);
    }
  };

  const handleTripPlannerClick = () => {
    try {
      if (!event?.id) return;
      if (isCurrentlyInTrip) {
        removeEventFromTrip(event.id);
        toast.success("Aus Trip Planner entfernt", { position: "top-center", duration: 2000 });
      } else {
        addEventToDay(event);
        toast.success("Zu Trip Planner hinzugefügt", { position: "top-center", duration: 2000 });
      }
    } catch (err) {
      console.error('Error in handleTripPlannerClick:', err);
      toast.error('Aktion konnte nicht ausgeführt werden');
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      if (!seoSlug) {
        toast.error("Event-Link nicht verfügbar", { position: "top-center" });
        return;
      }
      const eventUrl = `${window.location.origin}/event/${seoSlug}`;
      await navigator.clipboard.writeText(eventUrl);
      toast.success("Link kopiert!", {
        duration: 2000,
        position: "top-center"
      });
      setShowSharePopup(false);
    } catch (err) {
      console.error('Error in copyToClipboard:', err);
      toast.error("Fehler beim Kopieren", { position: "top-center" });
    }
  };

  // WhatsApp share
  const shareViaWhatsApp = () => {
    try {
      if (!event) return;
      const eventUrl = `${window.location.origin}/event/${seoSlug}`;
      const text = `Check out this event: ${event?.title || 'Event'} ${eventUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch (err) {
      console.error('Error in shareViaWhatsApp:', err);
      toast.error('Fehler beim Teilen');
    }
  };

  // Email share
  const shareViaEmail = () => {
    try {
      if (!event) return;
      const eventUrl = `${window.location.origin}/event/${seoSlug}`;
      const subject = `Event: ${event?.title || 'Event'}`;
      const body = `Hallo,\n\nIch habe diesen Event gefunden:\n${event?.title || 'Event'}\n\n${eventUrl}\n\nLiebe Grüsse`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (err) {
      console.error('Error in shareViaEmail:', err);
      toast.error('Fehler beim Teilen');
    }
  };

  const handleShareClick = async () => {
    try {
      if (!event?.external_id) return;
      const shareUrl = `${window.location.origin}/events/${event.external_id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: event?.title || 'Event',
            text: event?.short_description || event?.title || 'Event',
            url: shareUrl
          });
        } catch (err) {
          console.log('Share cancelled');
        }
      } else {
        navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      console.error('Error in handleShareClick:', err);
    }
  };

  const handleTicketClick = () => {
    try {
      if (!event?.ticket_url) return;
      window.open(event.ticket_url, '_blank');
    } catch (err) {
      console.error('Error in handleTicketClick:', err);
      toast.error('Ticket-Link konnte nicht geöffnet werden');
    }
  };

  const handleDetailClick = () => {
    try {
      if (!event) return;
      // Expand popup to full height and update URL for SEO
      setIsExpanded(true);
      if (event?.external_id) {
        window.history.replaceState(null, '', `/event/${event.external_id}`);
      }
    } catch (err) {
      console.error('Error in handleDetailClick:', err);
    }
  };

  // Safety guard: don't render if no event or not open
  if (!event || !isOpen) {
    return null;
  }

  return (
      <div
        className={`fixed inset-x-0 top-0 z-[65] mt-0 flex h-auto flex-col rounded-b-[16px] bg-white transition-all duration-300 md:hidden ${isExpanded ? 'max-h-[100vh]' : 'max-h-[30vh]'}`}
        style={{ pointerEvents: 'auto' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Handle Indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-3 pb-2">
          {/* Image with overlaid close button */}
          {event?.image_url && (
            <div className="relative">
              <img
                src={event.image_url}
                alt={event?.title || 'Event'}
                className={`w-full object-cover rounded-lg mb-1.5 transition-all duration-300 ${isExpanded ? 'h-48' : 'h-16'}`}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
              {/* Close Button - overlaid on image */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-1.5 right-1.5 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          )}

          {/* Title - Full when expanded */}
          <h2 className={`font-bold text-gray-900 mb-1.5 transition-all duration-300 ${isExpanded ? 'text-lg leading-tight' : 'text-sm line-clamp-1'}`}>
            {event?.title || 'Event'}
          </h2>

          {/* Description - Full when expanded */}
          {event?.short_description && (
            <p className={`text-gray-700 mb-2 transition-all duration-300 ${isExpanded ? 'text-sm leading-relaxed' : 'text-xs leading-tight line-clamp-1'}`}>
              {event.short_description}
            </p>
          )}

          {/* Action Icons Pills - One Row */}
          <div className="flex items-center gap-1.5 justify-start mb-2 flex-wrap">
            {/* Star - Buzz Score with Rating */}
            <Popover open={showRatingPopup} onOpenChange={setShowRatingPopup}>
              <PopoverTrigger asChild>
                <button
                  className="h-10 px-3 rounded-full flex items-center justify-center gap-1 hover:scale-105 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Star size={16} className="fill-amber-500 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{event?.buzz_score || 0}</span>
                  {showRatingSuccess && (
                    <CheckCircle size={14} className="text-green-500 animate-pulse" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="center" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
                  {userRating ? 'Deine Bewertung ändern:' : 'Event bewerten:'}
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRating(star);
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={24}
                        className={
                          (hoverRating || userRating || 0) >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>
                {userRating && (
                  <p className="text-[10px] text-gray-400 text-center mt-1">
                    Du hast {userRating}/5 gegeben
                  </p>
                )}
              </PopoverContent>
            </Popover>

            {/* Heart - Favorite */}
            <button
              onClick={handleFavoriteClick}
              className="h-10 px-3 rounded-full flex items-center justify-center hover:scale-105 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              <Heart
                size={16}
                className={cn(
                  "transition-all",
                  isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
                )}
              />
            </button>

            {/* Share Button with Popup */}
            <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
              <PopoverTrigger asChild>
                <button
                  className="h-10 px-3 rounded-full flex items-center justify-center hover:scale-105 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Copy size={16} className="text-gray-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Link kopieren</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareViaWhatsApp();
                      setShowSharePopup(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-xs font-medium text-gray-700">WhatsApp</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareViaEmail();
                      setShowSharePopup(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Mail size={16} className="text-gray-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">E-Mail</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Briefcase - Trip Planner */}
            <button
              onClick={handleTripPlannerClick}
              className="h-10 px-3 rounded-full flex items-center justify-center hover:scale-105 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              <Briefcase
                size={16}
                className={cn(
                  "transition-all",
                  isCurrentlyInTrip ? "text-red-500" : "text-gray-600"
                )}
              />
            </button>

            {/* Ticket kaufen - with text (Blue) */}
            <button
              onClick={handleTicketClick}
              className="h-10 w-10 rounded-full flex items-center justify-center hover:scale-105 transition-all ml-auto"
              style={{
                background: 'rgba(30, 58, 138, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 4px 16px 0 rgba(30, 58, 138, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
              title="Ticket kaufen"
            >
              <ShoppingCart size={16} className="text-white" />
            </button>
          </div>

          {/* Location and Detail/Collapse - Same Row */}
          <div className="flex items-center justify-between pb-1">
            {/* Location - Left */}
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin size={14} />
              <span className={isExpanded ? '' : 'line-clamp-1'}>
                {(() => {
                  try {
                    return event ? getEventLocation(event) : 'Ort unbekannt';
                  } catch (err) {
                    console.error('Error getting event location:', err);
                    return 'Ort unbekannt';
                  }
                })()}
              </span>
            </div>

            {/* Detail or Collapse - Right */}
            {!isExpanded ? (
              <button
                onClick={handleDetailClick}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline whitespace-nowrap"
              >
                Detail
              </button>
            ) : (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline whitespace-nowrap flex items-center gap-1"
              >
                <ChevronDown size={14} />
                <span>Zurück</span>
              </button>
            )}
          </div>
        </div>
      </div>
  );
};
