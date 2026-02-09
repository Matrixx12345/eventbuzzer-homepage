import { useState, useMemo, useEffect } from "react";
import { Heart, MapPin, Star, Briefcase } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLocationWithMajorCity } from "@/utils/swissPlaces";
import {
  getEventLocation,
  convertToUmlauts,
  getCategoryLabel,
} from "@/utils/eventUtilities";
import { PlannedEventsByDay } from "@/contexts/TripPlannerContext";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";

const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

// Helper functions for user ratings (localStorage)
const getUserRating = (eventId: string): number | null => {
  const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
  return ratings[eventId] || null;
};

const setUserRating = (eventId: string, rating: number) => {
  const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
  ratings[eventId] = rating;
  localStorage.setItem('eventRatings', JSON.stringify(ratings));
};

interface Event {
  id: string;
  external_id?: string;
  title: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  gallery_urls?: string[];
  latitude?: number;
  longitude?: number;
  buzz_score?: number;
  relevance_score?: number;
  venue_name?: string;
  address_city?: string;
  location?: string;
}

interface MobileEventCardProps {
  event: Event;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: (event: Event) => void;
  onEventClick: (event: Event) => void;
  nearbyEventsFilter: string | null;
  setNearbyEventsFilter: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setDisplayedEventsCount: (count: number) => void;
  setFlyToLocation: (location: { lng: number; lat: number; zoom: number } | null) => void;
  previousMapState: { center: [number, number]; zoom: number } | null;
  setPreviousMapState: (state: { center: [number, number]; zoom: number } | null) => void;
  plannedEventsByDay: PlannedEventsByDay;
  setPlannedEventsByDay: (events: PlannedEventsByDay) => void;
  activeDay: number;
  handleMapMovement: (events: Array<{ eventId: string; event: Event; duration: number }>) => void;
}

export const MobileEventCard = ({
  event,
  index,
  isFavorited,
  onToggleFavorite,
  onEventClick,
  nearbyEventsFilter,
  setNearbyEventsFilter,
  setCurrentPage,
  setDisplayedEventsCount,
  setFlyToLocation,
  previousMapState,
  setPreviousMapState,
  plannedEventsByDay,
  setPlannedEventsByDay,
  activeDay,
  handleMapMovement,
}: MobileEventCardProps) => {
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRatingState] = useState<number | null>(null);
  const [coffeeClickFeedback, setCoffeeClickFeedback] = useState(false);

  const imageUrl = event.image_url || getPlaceholderImage(index);

  // Load user's existing rating for this event
  useEffect(() => {
    if (event?.id) {
      setUserRatingState(getUserRating(event.id));
    }
  }, [event?.id]);

  // Location formatieren
  const locationName = getEventLocation(event);
  const locationText = event.latitude && event.longitude
    ? getLocationWithMajorCity(event.latitude, event.longitude, locationName)
    : (locationName || "Schweiz");

  // Use AI-generated short_description or full description
  const description = event.short_description || event.description || "";

  const buzzScore = event.buzz_score || event.relevance_score || 75;
  const isHot = buzzScore >= 80;

  // Rating berechnen (0-5) basierend auf buzzScore (0-100) + user rating boost
  const baseRating = buzzScore / 20;
  const ratingBoost = userRating ? (userRating - 3) * 0.1 : 0;
  const rating = Math.min(5, Math.max(0, baseRating + ratingBoost));
  const goldStars = Math.floor(rating);
  const grayStars = 5 - goldStars;

  // Check if event is already in trip planner (across all days)
  // Memoize to prevent re-calculation on every render (988 events × flat() = massive loop)
  const allPlannedEvents = useMemo(
    () => Object.values(plannedEventsByDay).flat().filter(Boolean),
    [plannedEventsByDay]
  );
  const isInTrip = allPlannedEvents.some(pe => pe.eventId === event.id);

  // Handle rating submission
  const handleRating = (ratingValue: number) => {
    setUserRating(event.id, ratingValue);
    setUserRatingState(ratingValue);
    setShowRatingPopup(false);
    toast.success(`Danke für deine Bewertung! ⭐ ${ratingValue}/5`, { duration: 2000 });
  };

  return (
    <article
      onClick={() => onEventClick(event)}
      className="group bg-white rounded-2xl transition-all duration-300 overflow-hidden border border-stone-200 cursor-pointer hover:shadow-lg max-w-full"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Mobile: Vertical layout */}
      <div className="w-full flex flex-col">
        {/* Image Section - Mobile: Full width, 140px height */}
        <div className="relative w-full flex-shrink-0 h-[140px] p-1.5 bg-white rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)' }}>
          <div className="relative w-full h-full overflow-hidden rounded">
            <img
              src={imageUrl}
              alt={event.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Category Badge */}
            {(() => {
              const categoryLabel = getCategoryLabel(event);
              return categoryLabel ? (
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-white/70 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
                    {categoryLabel}
                  </span>
                </div>
              ) : null;
            })()}

            {/* Distance Badge - top right (only for nearby filter) */}
            {nearbyEventsFilter && (event as any).distanceText && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-stone-700 text-[10px] font-semibold px-3 py-1.5 rounded-full shadow-sm border border-stone-200/50">
                  {(event as any).distanceText} entfernt
                </span>
              </div>
            )}

            {/* Gallery Dots Indicator */}
            {event.gallery_urls && event.gallery_urls.length > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                {event.gallery_urls.slice(0, 4).map((_: any, i: number) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Section - Mobile: Compact padding */}
        <div className="w-full px-3 pt-2 pb-2 flex flex-col justify-between min-w-0">
          <div className="mt-0">
            {/* Title - Mobile: Smaller text */}
            <h3 className="text-base font-semibold text-stone-900 group-hover:text-amber-700 transition-colors mb-0.5 truncate leading-tight font-sans">
              {event.title}
            </h3>

            {/* Location */}
            <div className="text-xs text-stone-900 mb-1">
              {locationText}
            </div>

            {/* Description - Hidden on mobile for compact view */}
            {event.short_description && (
              <p
                className="text-xs text-gray-500 leading-relaxed line-clamp-2"
                lang="de"
                style={{ hyphens: 'auto', WebkitHyphens: 'auto' }}
              >
                {convertToUmlauts(event.short_description)}
              </p>
            )}
          </div>

          {/* Glassmorphism Action Pill - Mobile version */}
          <div className="flex items-center justify-center pt-3">
            <div
              className="inline-flex items-center justify-between gap-4 px-6 py-2.5 rounded-full w-full"
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              {/* Star Rating */}
              <Popover open={showRatingPopup} onOpenChange={setShowRatingPopup}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRatingPopup(true);
                    }}
                    className="group/rating relative flex items-center gap-1 pl-1 pointer-events-auto"
                  >
                    <Star size={18} className="text-[#fbbf24] fill-none stroke-[1.5]" />
                    <span className="text-sm font-semibold text-gray-800">
                      {rating.toFixed(1)}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
                  align="start"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-800">
                      Event bewerten
                    </div>
                    <div className="flex gap-2 justify-center py-2">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRating(starValue);
                          }}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={24}
                            className={cn(
                              starValue <= (hoverRating || userRating || 0)
                                ? 'fill-[#fcd34d] text-[#fcd34d]'
                                : 'text-gray-300'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    {userRating && (
                      <div className="text-xs text-gray-500 text-center">
                        Deine Bewertung: {userRating}/5 ⭐
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Divider */}
              <div className="w-px h-3 bg-gradient-to-b from-transparent via-gray-400/40 to-transparent" />

              {/* Favorit */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(event);
                }}
                className="group/heart relative p-0.5 hover:scale-110 hover:bg-white/30 rounded-md transition-all duration-200 pointer-events-auto"
              >
                <Heart
                  size={20}
                  className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-700"}
                />
              </button>

              {/* Divider */}
              <div className="w-px h-3 bg-gradient-to-b from-transparent via-gray-400/40 to-transparent" />

              {/* Events in der Nähe */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (nearbyEventsFilter === event.id) {
                    setNearbyEventsFilter(null);
                    if (previousMapState) {
                      setFlyToLocation({
                        lng: previousMapState.center[0],
                        lat: previousMapState.center[1],
                        zoom: previousMapState.zoom
                      });
                      setPreviousMapState(null);
                    }
                  } else {
                    setIsLoadingNearby(true);
                    setTimeout(() => {
                      setNearbyEventsFilter(event.id);
                      setCurrentPage(1);
                      setDisplayedEventsCount(30);
                      setIsLoadingNearby(false);
                      if (event.latitude && event.longitude) {
                        setFlyToLocation({
                          lng: event.longitude,
                          lat: event.latitude,
                          zoom: 10
                        });
                      }
                    }, 1500);
                  }
                }}
                disabled={isLoadingNearby}
                className={cn(
                  "group/nearby relative p-0.5 rounded-md transition-all duration-200 hover:scale-110 pointer-events-auto",
                  nearbyEventsFilter === event.id ? "bg-orange-100" : "hover:bg-white/30",
                  isLoadingNearby && "opacity-50 cursor-wait"
                )}
              >
                <MapPin
                  size={20}
                  className={cn(
                    nearbyEventsFilter === event.id ? "text-orange-600" : "text-gray-700",
                    isLoadingNearby && "animate-spin"
                  )}
                />
              </button>

              {/* Divider */}
              <div className="w-px h-3 bg-gradient-to-b from-transparent via-gray-400/40 to-transparent" />

              {/* Zu Trip Planner hinzufügen */}
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  setCoffeeClickFeedback(true);
                  setTimeout(() => setCoffeeClickFeedback(false), 600);

                  if (isInTrip) {
                    const updated = { ...plannedEventsByDay };
                    Object.keys(updated).forEach(day => {
                      updated[Number(day)] = updated[Number(day)].filter(pe => pe.eventId !== event.id);
                    });
                    setPlannedEventsByDay(updated);
                    toast(`${event.title} aus der Reise entfernt`);
                  } else {
                    const museumKeywords = ['museum', 'galerie', 'gallery', 'kunstmuseum', 'art museum'];
                    const isMuseum = museumKeywords.some(keyword => event.title.toLowerCase().includes(keyword));
                    const defaultDuration = isMuseum ? 150 : 120;

                    const currentDayEvents = plannedEventsByDay[activeDay] || [];
                    const updated = {
                      ...plannedEventsByDay,
                      [activeDay]: [...currentDayEvents, {
                        eventId: event.id,
                        event: event,
                        duration: defaultDuration
                      }]
                    };
                    setPlannedEventsByDay(updated);

                    const allEvents = Object.values(updated).flat().filter(Boolean);
                    handleMapMovement(allEvents);

                    toast(`${event.title} zu Tag ${activeDay} hinzugefügt`);
                  }
                }}
                className={cn(
                  "group/trip-add relative p-0.5 pr-1 rounded-md transition-all duration-200 pointer-events-auto hover:bg-white/30",
                  coffeeClickFeedback && "scale-95"
                )}
              >
                <Briefcase size={20} className={cn(
                  "transition-colors duration-200",
                  isInTrip && "text-red-500",
                  !isInTrip && "text-gray-700",
                  coffeeClickFeedback && "opacity-70"
                )} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
