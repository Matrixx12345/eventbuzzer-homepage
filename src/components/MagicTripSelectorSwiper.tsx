/**
 * Magic Trip Selector Swiper
 * Interactive swiper for discovering and selecting events
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, MapPin, Heart, ChevronRight, ChevronLeft, Briefcase, Star } from "lucide-react";
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
  // Day/Night theme based on current hour
  const isDayTime = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  }, []);

  // Theme colors
  const t = useMemo(() => isDayTime ? {
    // Day theme
    bg: 'bg-white',
    bgOverlay: 'bg-white/95',
    card: 'bg-white',
    cardBorder: 'border-gray-200',
    cardShadow: '0 0 60px 15px rgba(0, 0, 0, 0.08), 0 0 120px 30px rgba(0, 0, 0, 0.03)',
    text: 'text-gray-900',
    textHover: 'hover:text-gray-700',
    textSecondary: 'text-gray-600',
    textTertiary: 'text-gray-500',
    textDesc: 'text-gray-600',
    textDescHover: 'hover:text-gray-700',
    gradientPhoto: 'bg-gradient-to-t from-white via-white/60 to-transparent',
    gradientBottom: 'bg-gradient-to-t from-white via-white to-transparent',
    chevron: 'bg-white/50 hover:bg-white/70',
    closeBtn: 'bg-white/60 hover:bg-white/80',
    iconColor: 'text-gray-900',
    spinner: 'border-gray-900',
    tooltip: 'bg-white/95 border-gray-200 text-gray-900',
    starBg: 'text-gray-900',
    actionBgBlue: 'bg-transparent',
    actionBgRed: 'bg-transparent',
    actionBgGreen: 'bg-transparent',
    actionBgBlueHover: 'hover:bg-gray-100',
    actionBgRedHover: 'hover:bg-gray-100',
    actionBgGreenHover: 'hover:bg-gray-100',
    modalCard: 'bg-white border-gray-200',
    modalText: 'text-gray-900',
    modalTextSecondary: 'text-gray-700',
    modalBtn: 'bg-gray-900 text-white hover:bg-gray-800',
    endBtn: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  } : {
    // Night theme (current)
    bg: 'bg-black',
    bgOverlay: 'bg-black/80',
    card: 'bg-black',
    cardBorder: 'border-white/8',
    cardShadow: '0 0 60px 25px rgba(255, 255, 255, 0.08), 0 0 120px 50px rgba(255, 255, 255, 0.03)',
    text: 'text-white',
    textHover: 'hover:text-white/80',
    textSecondary: 'text-white/50',
    textTertiary: 'text-white/50',
    textDesc: 'text-white/60',
    textDescHover: 'hover:text-white/70',
    gradientPhoto: 'bg-gradient-to-t from-black via-black/60 to-transparent',
    gradientBottom: 'bg-gradient-to-t from-black via-black to-transparent',
    chevron: 'bg-black/30 hover:bg-black/50',
    closeBtn: 'bg-black/50 hover:bg-black/70',
    iconColor: 'text-white',
    spinner: 'border-white',
    tooltip: 'bg-black/80 border-white/20 text-white',
    starBg: 'text-white/70',
    actionBgBlue: 'bg-blue-500/25 border-blue-500/50',
    actionBgRed: 'bg-red-500/25 border-red-500/50',
    actionBgGreen: 'bg-green-500/25 border-green-500/50',
    actionBgBlueHover: 'hover:bg-blue-500/35',
    actionBgRedHover: 'hover:bg-red-500/35',
    actionBgGreenHover: 'hover:bg-green-500/35',
    modalCard: 'bg-black border-white/20',
    modalText: 'text-white',
    modalTextSecondary: 'text-white/90',
    modalBtn: 'bg-white text-black hover:bg-gray-100',
    endBtn: 'bg-stone-700 hover:bg-stone-600 text-white',
  }, [isDayTime]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Nearby filter state
  const [nearbyFilterActive, setNearbyFilterActive] = useState(false);
  const [nearbyFilterEventId, setNearbyFilterEventId] = useState<string | null>(null);
  const [cachedNearbyEvents, setCachedNearbyEvents] = useState<Event[]>([]);

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

  // Get available events (use cached nearby events if filter is active)
  const availableEvents = useMemo(() => {
    if (nearbyFilterActive && cachedNearbyEvents.length > 0) {
      return cachedNearbyEvents;
    }
    return allEvents;
  }, [allEvents, nearbyFilterActive, cachedNearbyEvents]);

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
    if (!currentEvent) return;

    onEventSelected(currentEvent);
    setAddedToTripIds(prev => new Set(prev).add(currentEvent.id));
    toast.success(`✅ ${currentEvent.title} zu Tag ${activeDay} hinzugefügt!`);
  }, [currentEvent, onEventSelected, activeDay]);

  // Handle Toggle Favorite (Heart)
  const handleToggleFavorite = useCallback(async () => {
    if (!currentEvent) return;

    const isFavorited = favoritedEventIds.has(currentEvent.id);

    // Optimistic update
    setFavoritedEventIds(prev => {
      const updated = new Set(prev);
      if (isFavorited) {
        updated.delete(currentEvent.id);
      } else {
        updated.add(currentEvent.id);
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
            updated.add(currentEvent.id);
          } else {
            updated.delete(currentEvent.id);
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
            .eq('event_id', currentEvent.id);

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
              event_id: currentEvent.id,
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
  }, [currentEvent, favoritedEventIds]);

  // Handle Nearby Filter (MapPin)
  const handleNearbyFilter = useCallback(() => {
    if (!currentEvent) return;

    if (nearbyFilterActive && nearbyFilterEventId === currentEvent.id) {
      // Deactivate filter
      setNearbyFilterActive(false);
      setNearbyFilterEventId(null);
      setCachedNearbyEvents([]);
      setCurrentIndex(0); // Reset to start
      toast.info("Nearby-Filter deaktiviert");
    } else {
      // Activate filter - Calculate nearby events ONCE and cache them
      if (!currentEvent.latitude || !currentEvent.longitude) {
        toast.error("Event hat keine GPS-Koordinaten");
        return;
      }

      // Calculate distances for all events
      const eventsWithDistance = allEvents
        .map(event => {
          const dist = haversineDistance(
            currentEvent.latitude!,
            currentEvent.longitude!,
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

      // Cache the calculated nearby events
      const cachedEvents = nearbyEvents.map(item => item.event);
      setCachedNearbyEvents(cachedEvents);

      setNearbyFilterActive(true);
      setNearbyFilterEventId(currentEvent.id);
      setCurrentIndex(0); // Reset to start of filtered list
      toast.success(`Zeige ${cachedEvents.length} Events in der Nähe`);
    }
  }, [currentEvent, nearbyFilterActive, nearbyFilterEventId, allEvents]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAllEvents([]);
      setNearbyFilterActive(false);
      setNearbyFilterEventId(null);
      setCachedNearbyEvents([]);
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
    <div className={`fixed inset-0 ${t.bg} z-[110] flex items-center justify-center p-4 md:p-8`}>
      {/* Expanded Text Modal */}
      {expandedText && (
        <div
          className={`fixed inset-0 ${t.bgOverlay} backdrop-blur-sm z-[120] flex items-center justify-center p-6 cursor-pointer`}
          onClick={() => setExpandedText(null)}
        >
          <div
            className={`${t.modalCard} rounded-2xl p-8 max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl cursor-default`}
            onClick={(e) => e.stopPropagation()}
          >
            {expandedText === 'title' && (
              <div>
                <h2 className={`text-5xl font-bold ${t.modalText} mb-6 leading-tight`}>
                  {currentEvent?.title}
                </h2>
                <button
                  onClick={() => setExpandedText(null)}
                  className={`mt-8 px-6 py-3 ${t.modalBtn} font-semibold rounded-lg transition-colors`}
                >
                  Schließen
                </button>
              </div>
            )}
            {expandedText === 'description' && (
              <div>
                <p className={`text-2xl ${t.modalTextSecondary} leading-relaxed`}>
                  {currentEvent?.short_description || currentEvent?.description || "Keine Beschreibung verfügbar"}
                </p>
                <button
                  onClick={() => setExpandedText(null)}
                  className={`mt-8 px-6 py-3 ${t.modalBtn} font-semibold rounded-lg transition-colors`}
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
            <div className={`animate-spin rounded-full h-16 w-16 border-b-2 ${t.spinner} mb-4`}></div>
            <p className={`${t.text} text-lg`}>Events werden geladen...</p>
          </div>
        ) : noMoreEvents ? (
          <div className={`flex flex-col items-center justify-center h-full ${t.text}`}>
            <p className="text-2xl font-bold mb-3">
              {nearbyFilterActive ? "Keine Events in der Nähe" : "Keine weiteren Events verfügbar"}
            </p>
            <p className={`${t.textSecondary} mb-8 text-center`}>
              {nearbyFilterActive ? "Deaktiviere den Filter, um mehr Events zu sehen" : "Du hast alle passenden Events gesehen!"}
            </p>
            {nearbyFilterActive && (
              <button
                onClick={() => {
                  setNearbyFilterActive(false);
                  setNearbyFilterEventId(null);
                  setCachedNearbyEvents([]);
                  setCurrentIndex(0);
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
              >
                Filter aufheben
              </button>
            )}
            <button
              onClick={onClose}
              className={`mt-4 px-8 py-3 ${t.endBtn} font-semibold rounded-xl transition-colors`}
            >
              Schließen
            </button>
          </div>
        ) : currentEvent ? (
          <div
            className={`relative w-full max-h-[88vh] ${t.card} rounded-3xl overflow-hidden shadow-2xl border-[1.5px] ${isDayTime ? 'border-gray-300' : t.cardBorder}`}
            style={{
              boxShadow: t.cardShadow
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left Chevron - Go Back */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 ${t.chevron} disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-md rounded-full flex items-center justify-center transition-all`}
              aria-label="Previous event"
            >
              <ChevronLeft size={32} className={t.iconColor} strokeWidth={2.5} />
            </button>

            {/* Right Chevron - Go Forward */}
            <button
              onClick={handleNext}
              disabled={noMoreEvents}
              className={`absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 ${t.chevron} disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-md rounded-full flex items-center justify-center transition-all`}
              aria-label="Next event"
            >
              <ChevronRight size={32} className={t.iconColor} strokeWidth={2.5} />
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
                        className={`backdrop-blur-md text-[11px] md:text-[13px] font-bold px-3 py-1.5 rounded whitespace-nowrap shadow-lg ${
                          isDayTime
                            ? 'bg-white/70 text-gray-900'
                            : 'bg-white/15 text-white'
                        }`}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </span>
                    ))}
                    {currentEvent.tags.length > 4 && (
                      <span className={`backdrop-blur-md text-[11px] md:text-[13px] font-bold px-3 py-1.5 rounded shadow-lg ${
                        isDayTime
                          ? 'bg-white/70 text-gray-900'
                          : 'bg-white/15 text-white'
                      }`}>
                        +{currentEvent.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button - Top Right */}
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 md:top-6 md:right-6 w-11 h-11 ${t.closeBtn} backdrop-blur-md rounded-full flex items-center justify-center transition-colors`}
                aria-label="Close"
              >
                <X size={22} className={t.iconColor} strokeWidth={2.5} />
              </button>

              {/* No gradient overlay - removed weichfilter effect */}
            </div>

            {/* Text Content Area - Middle */}
            <div className="relative px-6 md:px-8 pt-6 lg:pt-3 xl:pt-6 pb-40 lg:pb-32 xl:pb-40 overflow-y-auto">
              {/* Title - Clickable to expand */}
              <div className="relative">
                <h2
                  onClick={() => setExpandedText('title')}
                  className={`text-2xl md:text-3xl lg:text-lg xl:text-3xl font-semibold lg:font-medium xl:font-semibold ${t.text} mb-3 lg:mb-1 xl:mb-3 leading-tight line-clamp-1 cursor-pointer ${t.textHover} transition-colors duration-200 pr-16`}
                >
                  {currentEvent.title}
                </h2>
                {/* Star Rating - Absolut rechts vom Titel */}
                {currentEvent.buzz_score !== undefined && (
                  <div className={`absolute top-0 right-0 ${t.starBg} bg-transparent backdrop-blur-md px-3 md:px-4 rounded-full font-bold text-sm md:text-base flex items-center gap-2 w-fit h-10 md:h-12`}>
                    <Star size={24} strokeWidth={2.5} className="text-[#fbbf24] fill-none" />
                    <span className="whitespace-nowrap">{(currentEvent.buzz_score / 20).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Location - Own Line */}
              {currentEvent.latitude && currentEvent.longitude && (
                <div className={`mb-2.5 lg:mb-0.5 xl:mb-2.5 ${t.textSecondary}`}>
                  <span className="text-sm md:text-base lg:text-xs xl:text-base font-semibold tracking-wide line-clamp-1">
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
                className={`${t.textDesc} text-sm md:text-base lg:text-xs xl:text-base leading-relaxed lg:leading-snug xl:leading-relaxed line-clamp-2 cursor-pointer ${t.textDescHover} transition-colors duration-200 font-medium tracking-wide`}
              >
                {currentEvent.short_description ||
                  currentEvent.description ||
                  "Entdecke dieses spannende Event in der Schweiz"}
              </p>
            </div>

            {/* Action Buttons - Fixed Bottom */}
            <div className={`absolute bottom-0 left-0 right-0 px-6 md:px-8 py-7 ${t.gradientBottom}`}>
              <div className="flex items-center justify-center">
                {/* 3 Action Buttons - Visuell zentriert */}
                <div className="flex items-center gap-5 md:gap-7">
                {/* MapPin - Nearby Filter (Blue) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNearbyFilter();
                    e.currentTarget.blur();
                  }}
                  className={`group/nearby relative w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    nearbyFilterActive && nearbyFilterEventId === currentEvent.id
                      ? `${t.actionBgBlue} border-2 ${isDayTime ? 'border-blue-500' : 'border-blue-500'} ${t.actionBgBlueHover}`
                      : `${t.actionBgBlue} border-[1.5px] ${isDayTime ? 'border-blue-500' : 'border-blue-500/50'} ${t.actionBgBlueHover}`
                  }`}
                  title="In der Nähe suchen"
                >
                  <MapPin
                    size={30}
                    className={`${isDayTime ? 'text-blue-600' : 'text-blue-400'} transition-colors duration-300`}
                    strokeWidth={2.5}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 opacity-0 md:group-hover/nearby:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <div className={`${t.tooltip} text-xs font-light px-3 py-2 rounded-md whitespace-nowrap backdrop-blur-sm border`}>
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
                  className={`group/heart relative w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    favoritedEventIds.has(currentEvent.id)
                      ? `${t.actionBgRed} border-2 ${isDayTime ? 'border-red-500' : 'border-red-500'} ${t.actionBgRedHover}`
                      : `${t.actionBgRed} border-[1.5px] ${isDayTime ? 'border-red-500' : 'border-red-500/50'} ${t.actionBgRedHover}`
                  }`}
                  title="Favorit"
                >
                  <Heart
                    size={30}
                    className={`transition-colors duration-300 ${
                      favoritedEventIds.has(currentEvent.id)
                        ? `${isDayTime ? 'text-red-600' : 'text-red-400'} fill-current`
                        : `${isDayTime ? 'text-red-600' : 'text-red-400'}`
                    }`}
                    strokeWidth={2.5}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 opacity-0 md:group-hover/heart:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <div className={`${t.tooltip} text-xs font-light px-3 py-2 rounded-md whitespace-nowrap backdrop-blur-sm border`}>
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
                  className={`group/trip relative w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    addedToTripIds.has(currentEvent.id)
                      ? `${t.actionBgGreen} border-2 ${isDayTime ? 'border-green-500' : 'border-green-500'} ${t.actionBgGreenHover}`
                      : `${t.actionBgGreen} border-[1.5px] ${isDayTime ? 'border-green-500' : 'border-green-500/50'} ${t.actionBgGreenHover}`
                  }`}
                  title="Zur Reise hinzufügen"
                >
                  <Briefcase
                    size={30}
                    className={`${isDayTime ? 'text-green-600' : 'text-green-400'} transition-colors duration-300`}
                    strokeWidth={2.5}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 opacity-0 md:group-hover/trip:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <div className={`${t.tooltip} text-xs font-light px-3 py-2 rounded-md whitespace-nowrap backdrop-blur-sm border`}>
                      Zur Reise hinzufügen
                    </div>
                  </div>
                </button>
                  </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className={`${t.text} text-lg`}>Keine Events verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
}
