/**
 * Magic Trip Selector Swiper
 * Interactive swiper for discovering and selecting events
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, MapPin, Heart, ChevronRight, ChevronLeft, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { haversineDistance } from "@/utils/geoHelpers";
import { getLocationWithMajorCity } from "@/utils/swissPlaces";

interface Event {
  id: string;
  title: string;
  image_url?: string;
  short_description?: string;
  description?: string;
  venue_name?: string;
  address_city?: string;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  category_main_id?: number;
  tags?: string[];
  price_from?: number;
  buzz_score?: number;
  buzz_boost?: number | string;
}

interface MagicTripSelectorSwiperProps {
  isOpen: boolean;
  onClose: () => void;
  activeDay: number;
  onEventSelected: (event: Event) => void;
}

export default function MagicTripSelectorSwiper({
  isOpen,
  onClose,
  activeDay,
  onEventSelected,
}: MagicTripSelectorSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Nearby filter state
  const [nearbyFilterActive, setNearbyFilterActive] = useState(false);
  const [nearbyFilterEventId, setNearbyFilterEventId] = useState<string | null>(null);

  // Favorites state
  const [favoritedEventIds, setFavoritedEventIds] = useState<Set<string>>(new Set());

  // Added to trip state
  const [addedToTripIds, setAddedToTripIds] = useState<Set<string>>(new Set());

  // Touch handling for swipe down
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Expanded text modal state
  const [expandedText, setExpandedText] = useState<'title' | 'description' | null>(null);

  // Load user location
  useEffect(() => {
    if (isOpen) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Fallback: Use Zurich as default
          setUserLocation({ lat: 47.3769, lng: 8.5417 });
        }
      );
    }
  }, [isOpen]);

  // Load initial events
  useEffect(() => {
    async function loadInitialEvents() {
      if (!isOpen) return;

      setLoading(true);

      try {
        const response = await supabase.functions.invoke("get-external-events", {
          body: {
            limit: 1500,
            offset: 0,
            filters: {},
          },
        });

        if (!response.data || !response.data.events) {
          throw new Error("No events returned");
        }

        // Filter events: exclude date-bound categories
        const dateBoundCategories = [1, 4, 7, 9, 13, 14];

        // Events to exclude by exact title
        const excludedTitles = ['disc golf', 'meringues', 'von tisch zu tisch'];

        let events = (response.data.events as Event[]).filter((e) => {
          // Basic filters
          if (!e.latitude || !e.longitude || !e.start_date) return false;
          if (dateBoundCategories.includes(e.category_main_id || 0)) return false;

          // Exclude by title
          if (excludedTitles.some(title => e.title?.toLowerCase() === title.toLowerCase())) {
            return false;
          }

          // Exclude Christmas events outside Nov-Dez
          const eventDate = new Date(e.start_date);
          const month = eventDate.getMonth() + 1; // 1-12
          const titleLower = e.title?.toLowerCase() || '';
          const isChristmasEvent = titleLower.includes('weihnacht') || titleLower.includes('noël') || titleLower.includes('noel');

          if (isChristmasEvent && (month < 11 || month > 12)) {
            return false;
          }

          return true;
        });

        // Sort by MUST-SEE tag first, then by buzz_score descending
        events.sort((a, b) => {
          // MUST-SEE events first (tag-based, not boost)
          const aIsMustSee = a.tags?.includes('must-see') ? 1 : 0;
          const bIsMustSee = b.tags?.includes('must-see') ? 1 : 0;
          if (aIsMustSee !== bIsMustSee) return bIsMustSee - aIsMustSee;

          // Then by buzz_score (manual scoring)
          const aScore = a.buzz_score || 0;
          const bScore = b.buzz_score || 0;
          return bScore - aScore;
        });

        setAllEvents(events);
      } catch (error) {
        console.error("Error loading events:", error);
        toast.error("Fehler beim Laden der Events");
      } finally {
        setLoading(false);
      }
    }

    loadInitialEvents();
  }, [isOpen]);

  // Get available events (filtered by nearby if active)
  const availableEvents = useMemo(() => {
    if (!nearbyFilterActive || !nearbyFilterEventId) {
      return allEvents;
    }

    const filterEvent = allEvents.find(e => e.id === nearbyFilterEventId);
    if (!filterEvent || !filterEvent.latitude || !filterEvent.longitude) {
      return allEvents;
    }

    // Calculate distances
    const eventsWithDistance = allEvents
      .filter(e => e.id !== filterEvent.id) // Exclude the filter event itself
      .map(event => {
        const dist = haversineDistance(
          filterEvent.latitude!,
          filterEvent.longitude!,
          event.latitude || 0,
          event.longitude || 0
        );
        return { event, distance: dist };
      });

    // Try 10km radius first
    let nearbyEvents = eventsWithDistance.filter(item => item.distance <= 10);

    // If less than 10 events, expand to 30km
    if (nearbyEvents.length < 10) {
      nearbyEvents = eventsWithDistance.filter(item => item.distance <= 30);
    }

    // Sort by MUST-SEE first, then by score + distance
    nearbyEvents.sort((a, b) => {
      // MUST-SEE events first (tag-based)
      const aIsMustSee = a.event.tags?.includes('must-see') ? 1 : 0;
      const bIsMustSee = b.event.tags?.includes('must-see') ? 1 : 0;
      if (aIsMustSee !== bIsMustSee) return bIsMustSee - aIsMustSee;

      // Then by score + distance
      const scoreA = a.event.buzz_score || 0;
      const scoreB = b.event.buzz_score || 0;

      // Normalize: score weight 60%, distance weight 40%
      const weightedA = (scoreA * 0.6) - (a.distance * 0.4);
      const weightedB = (scoreB * 0.6) - (b.distance * 0.4);

      return weightedB - weightedA;
    });

    return nearbyEvents.map(item => item.event);
  }, [allEvents, nearbyFilterActive, nearbyFilterEventId]);

  // Get current event
  const currentEvent = availableEvents[currentIndex];

  // Handle Next (Skip)
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // Handle Previous (Go Back)
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Handle Add to Trip (Briefcase)
  const handleAddToTrip = useCallback(() => {
    const event = availableEvents[currentIndex];
    if (!event) return;

    onEventSelected(event);
    setAddedToTripIds(prev => new Set(prev).add(event.id));
    toast.success(`✅ ${event.title} zu Tag ${activeDay} hinzugefügt!`);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, availableEvents, onEventSelected, activeDay]);

  // Handle Toggle Favorite (Heart)
  const handleToggleFavorite = useCallback(async () => {
    const event = availableEvents[currentIndex];
    if (!event) return;

    const isFavorited = favoritedEventIds.has(event.id);

    // Optimistic update
    setFavoritedEventIds(prev => {
      const updated = new Set(prev);
      if (isFavorited) {
        updated.delete(event.id);
      } else {
        updated.add(event.id);
      }
      return updated;
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Bitte melde dich an, um Favoriten zu speichern");
        // Revert optimistic update
        setFavoritedEventIds(prev => {
          const updated = new Set(prev);
          if (isFavorited) {
            updated.add(event.id);
          } else {
            updated.delete(event.id);
          }
          return updated;
        });
        return;
      }

      if (isFavorited) {
        // Remove from favorites
        try {
          const { error } = await (supabase as any)
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', event.id);

          if (error) {
            console.warn("Favorites table warning:", error.message);
            // Don't throw - just silently continue
          }
          toast.success("Aus Favoriten entfernt");
        } catch (err) {
          console.warn("Could not remove from favorites:", err);
          // Continue silently - this is optional functionality
        }
      } else {
        // Add to favorites
        try {
          const { error } = await (supabase as any)
            .from('favorites')
            .insert({
              user_id: user.id,
              event_id: event.id,
            });

          if (error) {
            console.warn("Favorites table warning:", error.message);
            // Don't throw - just silently continue
          }
          toast.success("Zu Favoriten hinzugefügt");
        } catch (err) {
          console.warn("Could not add to favorites:", err);
          // Continue silently - this is optional functionality
        }
      }
    } catch (error) {
      console.warn('Error toggling favorite:', error);
      // Don't show error toast - just silently update local state
    }
  }, [currentIndex, availableEvents, favoritedEventIds]);

  // Handle Nearby Filter (MapPin)
  const handleNearbyFilter = useCallback(() => {
    const event = availableEvents[currentIndex];
    if (!event) return;

    if (nearbyFilterActive && nearbyFilterEventId === event.id) {
      // Deactivate filter
      setNearbyFilterActive(false);
      setNearbyFilterEventId(null);
      setCurrentIndex(0); // Reset to start
      toast.info("Nearby-Filter deaktiviert");
    } else {
      // Activate filter
      setNearbyFilterActive(true);
      setNearbyFilterEventId(event.id);
      setCurrentIndex(0); // Reset to start of filtered list
      toast.success("Zeige Events in der Nähe");
    }
  }, [currentIndex, availableEvents, nearbyFilterActive, nearbyFilterEventId]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAllEvents([]);
      setNearbyFilterActive(false);
      setNearbyFilterEventId(null);
      setFavoritedEventIds(new Set());
      setAddedToTripIds(new Set());
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  // Touch handlers for swipe down
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Check if swipe is more vertical than horizontal
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Swipe down (deltaY > 0) → skip to next
      if (deltaY > 50) {
        handleNext();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen) return null;

  // Check if we've run out of events
  const noMoreEvents = currentIndex >= availableEvents.length;

  return (
    <div className="fixed inset-0 bg-black z-[110] flex items-center justify-center p-4 md:p-8">
      {/* Expanded Text Modal */}
      {expandedText && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setExpandedText(null)}
        >
          <div
            className="bg-black border border-white/20 rounded-2xl p-8 max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {expandedText === 'title' && (
              <div>
                <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                  {currentEvent?.title}
                </h2>
                <button
                  onClick={() => setExpandedText(null)}
                  className="mt-8 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Schließen
                </button>
              </div>
            )}
            {expandedText === 'description' && (
              <div>
                <p className="text-2xl text-white/90 leading-relaxed">
                  {currentEvent?.short_description || currentEvent?.description || "Keine Beschreibung verfügbar"}
                </p>
                <button
                  onClick={() => setExpandedText(null)}
                  className="mt-8 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Schließen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full h-full max-w-sm md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
            <p className="text-white text-lg">Events werden geladen...</p>
          </div>
        ) : noMoreEvents ? (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="text-2xl font-bold mb-3">
              {nearbyFilterActive ? "Keine Events in der Nähe" : "Keine weiteren Events verfügbar"}
            </p>
            <p className="text-white/70 mb-8 text-center">
              {nearbyFilterActive ? "Deaktiviere den Filter, um mehr Events zu sehen" : "Du hast alle passenden Events gesehen!"}
            </p>
            {nearbyFilterActive && (
              <button
                onClick={() => {
                  setNearbyFilterActive(false);
                  setNearbyFilterEventId(null);
                  setCurrentIndex(0);
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
              >
                Filter aufheben
              </button>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-8 py-3 bg-stone-700 hover:bg-stone-600 text-white font-semibold rounded-xl transition-colors"
            >
              Schließen
            </button>
          </div>
        ) : currentEvent ? (
          <div
            className="relative w-full max-h-[88vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/8"
            style={{
              boxShadow: '0 0 60px 25px rgba(255, 255, 255, 0.08), 0 0 120px 50px rgba(255, 255, 255, 0.03)'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left Chevron - Go Back */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 bg-black/30 hover:bg-black/50 disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-md rounded-full flex items-center justify-center transition-all"
              aria-label="Previous event"
            >
              <ChevronLeft size={32} className="text-white" strokeWidth={2.5} />
            </button>

            {/* Right Chevron - Go Forward */}
            <button
              onClick={handleNext}
              disabled={noMoreEvents}
              className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 bg-black/30 hover:bg-black/50 disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-md rounded-full flex items-center justify-center transition-all"
              aria-label="Next event"
            >
              <ChevronRight size={32} className="text-white" strokeWidth={2.5} />
            </button>

            {/* Photo Area - Top ~60% */}
            <div className="relative h-[60vh] md:h-[55vh] overflow-hidden">
              <img
                src={currentEvent.image_url || "/placeholder.jpg"}
                alt={currentEvent.title}
                className="w-full h-full object-cover"
              />

              {/* Top Left: MUST-SEE Badge + Multi-Tags */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex flex-col gap-2">
                {/* MUST-SEE Badge */}
                {currentEvent.tags?.includes('must-see') && (
                  <div className="bg-white text-black px-3 py-1.5 rounded-lg font-bold text-xs md:text-sm shadow-xl w-fit">
                    MUST-SEE
                  </div>
                )}

                {/* Multi-Tags - 4 pills + +X */}
                {currentEvent.tags && currentEvent.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {currentEvent.tags.slice(0, 4).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-white/80 backdrop-blur-md text-gray-800 text-[11px] md:text-[13px] font-bold px-3 py-1.5 rounded whitespace-nowrap shadow-lg"
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </span>
                    ))}
                    {currentEvent.tags.length > 4 && (
                      <span className="bg-white/80 backdrop-blur-md text-gray-800 text-[11px] md:text-[13px] font-bold px-3 py-1.5 rounded shadow-lg">
                        +{currentEvent.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button - Top Right */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-11 h-11 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={22} className="text-white" strokeWidth={2.5} />
              </button>

              {/* Gradient overlay at bottom of photo */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Text Content Area - Middle */}
            <div className="relative px-6 md:px-8 pt-6 lg:pt-3 xl:pt-6 pb-40 lg:pb-32 xl:pb-40 overflow-y-auto">
              {/* Title - Clickable to expand */}
              <h2
                onClick={() => setExpandedText('title')}
                className="text-2xl md:text-3xl lg:text-lg xl:text-3xl font-semibold lg:font-medium xl:font-semibold text-white mb-3 lg:mb-1 xl:mb-3 leading-tight line-clamp-1 cursor-pointer hover:text-white/80 transition-colors duration-200"
              >
                {currentEvent.title}
              </h2>

              {/* Location - Own Line */}
              {currentEvent.latitude && currentEvent.longitude && (
                <div className="mb-2.5 lg:mb-0.5 xl:mb-2.5 text-white/50">
                  <span className="text-sm md:text-base lg:text-xs xl:text-base font-normal tracking-wide line-clamp-1">
                    {getLocationWithMajorCity(
                      currentEvent.latitude,
                      currentEvent.longitude,
                      currentEvent.venue_name || currentEvent.address_city
                    )}
                  </span>
                </div>
              )}

              {/* Description - Clickable to expand */}
              <p
                onClick={() => setExpandedText('description')}
                className="text-white/60 text-sm md:text-base lg:text-xs xl:text-base leading-relaxed lg:leading-snug xl:leading-relaxed line-clamp-2 cursor-pointer hover:text-white/70 transition-colors duration-200 font-light tracking-wide"
              >
                {currentEvent.short_description ||
                  currentEvent.description ||
                  "Entdecke dieses spannende Event in der Schweiz"}
              </p>
            </div>

            {/* Action Buttons - Fixed Bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 py-7 bg-gradient-to-t from-black via-black to-transparent">
              <div className="flex items-center">
                {/* Star Rating - Ganz links */}
                {currentEvent.buzz_score !== undefined && (
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md text-white/70 px-3 md:px-4 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm shadow-lg hover:bg-white/10 transition-all flex items-center gap-1.5 w-fit h-14 md:h-16 flex-shrink-0">
                    <span className="text-lg md:text-xl">⭐</span>
                    <span>{(currentEvent.buzz_score / 20).toFixed(1)}</span>
                  </div>
                )}

                {/* Spacer - für Links-Verschiebung der zentrierten Buttons */}
                <div className="flex-1 flex items-center justify-center ml-[-80px]">
                  {/* 3 Action Buttons - Visuell zentriert */}
                  <div className="flex items-center gap-4 md:gap-6">
                {/* MapPin - Nearby Filter (Blue) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNearbyFilter();
                    e.currentTarget.blur();
                  }}
                  className={`group/nearby relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    nearbyFilterActive && nearbyFilterEventId === currentEvent.id
                      ? 'bg-blue-500/20 border-[3px] border-blue-400 hover:bg-blue-500/30'
                      : 'bg-blue-500/20 border border-blue-400/50 hover:bg-blue-500/30'
                  }`}
                  title="In der Nähe suchen"
                >
                  <MapPin
                    size={22}
                    className="text-blue-300 transition-colors duration-300"
                    strokeWidth={nearbyFilterActive && nearbyFilterEventId === currentEvent.id ? 2.5 : 1.5}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 hidden md:group-hover/nearby:block pointer-events-none">
                    <div className="bg-black/80 border border-white/20 text-white text-xs font-light px-3 py-2 rounded-md whitespace-nowrap backdrop-blur-sm">
                      {nearbyFilterActive && nearbyFilterEventId === currentEvent.id
                        ? "Filter aufheben"
                        : "In der Nähe suchen"}
                    </div>
                  </div>
                </button>

                {/* Heart - Favorite (Red) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite();
                    e.currentTarget.blur();
                  }}
                  className={`group/heart relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    favoritedEventIds.has(currentEvent.id)
                      ? 'bg-red-500/15 border-[3px] border-red-400 hover:bg-red-500/25'
                      : 'bg-red-500/15 border border-red-400/40 hover:bg-red-500/25'
                  }`}
                  title="Favorit"
                >
                  <Heart
                    size={22}
                    className={`transition-colors duration-300 ${
                      favoritedEventIds.has(currentEvent.id)
                        ? 'text-red-300 fill-red-300'
                        : 'text-red-300'
                    }`}
                    strokeWidth={favoritedEventIds.has(currentEvent.id) ? 2.5 : 1.5}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 hidden md:group-hover/heart:block pointer-events-none">
                    <div className="bg-black/80 border border-white/20 text-white text-xs font-light px-3 py-2 rounded-md whitespace-nowrap backdrop-blur-sm">
                      {favoritedEventIds.has(currentEvent.id)
                        ? "Aus Favoriten entfernen"
                        : "Zu Favoriten hinzufügen"}
                    </div>
                  </div>
                </button>

                {/* Briefcase - Add to Trip (Green) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToTrip();
                    e.currentTarget.blur();
                  }}
                  className={`group/trip relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    addedToTripIds.has(currentEvent.id)
                      ? 'bg-green-500/20 border-[3px] border-green-400 hover:bg-green-500/30'
                      : 'bg-green-500/20 border border-green-400/50 hover:bg-green-500/30'
                  }`}
                  title="Zur Reise hinzufügen"
                >
                  <Briefcase
                    size={22}
                    className="text-green-300 transition-colors duration-300"
                    strokeWidth={addedToTripIds.has(currentEvent.id) ? 2.5 : 1.5}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 hidden md:group-hover/trip:block pointer-events-none">
                    <div className="bg-black/80 border border-white/20 text-white text-xs font-light px-3 py-2 rounded-md whitespace-nowrap backdrop-blur-sm">
                      Zur Reise hinzufügen
                    </div>
                  </div>
                </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-lg">Keine Events verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
}
