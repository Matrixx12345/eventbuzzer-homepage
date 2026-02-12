/**
 * EventListSwiper - Swiper-style event viewer for the EventList page
 * Based on MagicTripSelectorSwiper design (card stack, blurred bg, compact action bar)
 * Instead of loading its own events, it receives events from the parent EventList.
 */

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { X, MapPin, Heart, ChevronRight, Ticket, MoreHorizontal, ExternalLink, Share2, Copy, Mail, Undo2, SlidersHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { haversineDistance, SWISS_CITY_COORDS, distanceToLine } from "@/utils/geoHelpers";
import { getLocationWithMajorCity } from "@/utils/swissPlaces";
import { generateEventSlug, getEventLocation } from "@/utils/eventUtilities";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTripPlanner } from "@/contexts/TripPlannerContext";
import SwiperSidebar, { FilterCriteria } from "@/components/SwiperSidebar";

interface Event {
  id: string;
  external_id?: string;
  title: string;
  image_url?: string;
  short_description?: string;
  description?: string;
  venue_name?: string;
  address_city?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  end_date?: string;
  category_main_id?: number;
  tags?: string[];
  price_from?: number;
  price_to?: number;
  buzz_score?: number;
  buzz_boost?: number | string;
  relevance_score?: number;
  favorite_count?: number;
  url?: string;
  ticket_url?: string;
  gallery_urls?: string[];
  ticket_link?: string;
}

interface EventListSwiperProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  startIndex: number;
  onNearbyFilter?: (eventId: string) => void;
}

// Decode HTML entities in text from database
const decodeHtml = (text: string) => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

// Format date as "Sa, 20.06.26 | 18:00"
const formatEventDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const day = days[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  if (hh === '00' && min === '00') return `${day}, ${dd}.${mm}.${yy}`;
  return `${day}, ${dd}.${mm}.${yy} | ${hh}:${min}`;
};

// Format distance in km
const formatDistance = (distKm: number) => {
  if (distKm < 1) return `${Math.round(distKm * 1000)} m`;
  if (distKm < 10) return `${distKm.toFixed(1)} km`;
  return `${Math.round(distKm)} km`;
};

// Memoized Switzerland Map component for mobile - prevents unnecessary re-renders
const SwissMapMobile = memo(({ currentEvent, dayEvents }: {
  currentEvent: { latitude?: number; longitude?: number } | null;
  dayEvents: Array<{ event: { id?: string; latitude?: number; longitude?: number } }>;
}) => {
  return (
    <svg viewBox="0 0 1348.8688 865.04437" className="w-full h-auto max-h-36" style={{ transform: 'scaleX(1.2)' }} xmlns="http://www.w3.org/2000/svg">
      <image href="/swiss-outline.svg" width="1348.8688" height="865.04437" opacity="0.15" />

      {/* Städte-Marker mit Namen */}
      <circle cx="765" cy="213" r="7.5" fill="#6b7280" />
      <text x="775" y="223" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Zürich</text>

      <circle cx="71.3" cy="672.8" r="7.5" fill="#6b7280" />
      <text x="82" y="682" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Genf</text>

      <circle cx="495.2" cy="147" r="7.5" fill="#6b7280" />
      <text x="506" y="157" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Basel</text>

      <circle cx="214.7" cy="545" r="7.5" fill="#6b7280" />
      <text x="225" y="555" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Lausanne</text>

      <circle cx="453.8" cy="362" r="7.5" fill="#6b7280" />
      <text x="464" y="372" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Bern</text>

      <circle cx="576" cy="490" r="6" fill="#6b7280" />
      <text x="586" y="500" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Interlaken</text>

      <circle cx="828.0" cy="168" r="7" fill="#6b7280" />
      <text x="838" y="178" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Winterthur</text>

      <circle cx="706.5" cy="351" r="7.5" fill="#6b7280" />
      <text x="717" y="361" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Luzern</text>

      <circle cx="989" cy="167" r="7" fill="#6b7280" />
      <text x="999" y="177" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">St. Gallen</text>

      <circle cx="865" cy="768.2" r="7" fill="#6b7280" />
      <text x="875" y="778" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Lugano</text>

      <circle cx="1154" cy="546" r="6" fill="#6b7280" />
      <text x="1164" y="556" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">St. Moritz</text>

      <circle cx="542" cy="750" r="6" fill="#6b7280" />
      <text x="552" y="760" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Zermatt</text>

      <circle cx="395.0" cy="301" r="6" fill="#6b7280" />
      <text x="405" y="311" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Biel</text>

      {/* Planned trip events - purple dots */}
      {dayEvents.map((planned, index) => {
        if (!planned.event.latitude || !planned.event.longitude) return null;

        const anchorLat = 46.2;
        const stretch = planned.event.latitude <= anchorLat
          ? 1.1
          : 1.1 - ((planned.event.latitude - anchorLat) / (47.8 - anchorLat)) * 0.23;

        const x = ((planned.event.longitude - 5.9) / (10.5 - 5.9)) * 1348.8688;
        const y = ((1 - ((planned.event.latitude - 45.8) / (47.8 - 45.8)) * stretch)) * 865.04437 - (0.015 * 865.04437);

        return (
          <circle
            key={`trip-${planned.event.id || index}`}
            cx={x}
            cy={y}
            r="11"
            fill="#7e22ce"
            opacity="0.8"
          />
        );
      })}

      {/* Event location marker (red pulsing dot) */}
      {currentEvent?.latitude && currentEvent?.longitude && (() => {
        const anchorLat = 46.2;
        const stretch = currentEvent.latitude <= anchorLat
          ? 1.1
          : 1.1 - ((currentEvent.latitude - anchorLat) / (47.8 - anchorLat)) * 0.23;

        const x = ((currentEvent.longitude - 5.9) / (10.5 - 5.9)) * 1348.8688;
        const y = ((1 - ((currentEvent.latitude - 45.8) / (47.8 - 45.8)) * stretch)) * 865.04437 - (0.015 * 865.04437);

        return (
          <g key="current-event">
            <circle cx={x} cy={y} r="28" fill="#ef4444" opacity="0.2" />
            <circle cx={x} cy={y} r="32" fill="#ef4444" opacity="0.5" />
            <circle cx={x} cy={y} r="22" fill="#dc2626" className="animate-pulse" />
          </g>
        );
      })()}
    </svg>
  );
});

export default function EventListSwiper({
  isOpen,
  onClose,
  events,
  startIndex,
  onNearbyFilter,
}: EventListSwiperProps) {

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addEventToDay, removeEventFromTrip, activeDay, isInTrip, plannedEventsByDay } = useTripPlanner();

  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0); // Current drag offset
  const [isSwiping, setIsSwiping] = useState(false); // Whether actively swiping
  const [pendingAction, setPendingAction] = useState<'next' | 'prev' | null>(null); // Action to execute after transition

  // 3-dot menu & share
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);
  const [mobileTextExpanded, setMobileTextExpanded] = useState(false); // Mobile: expand title + description on click

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterCriteria>({ type: "none" });

  // "Zurück" navigation state
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);

  // Filtered events based on active filter (supports combining geographic + category)
  const filteredEvents = useMemo(() => {
    if (activeFilter.type === "none") return events;

    return events.filter(event => {
      // Geographic filters require coordinates
      let passesGeographicFilter = true;
      if (activeFilter.type === "city" || activeFilter.type === "route") {
        if (!event.latitude || !event.longitude) return false;
      }

      // Apply geographic filter (city OR route)
      if (activeFilter.type === "city") {
        if (!activeFilter.city || !activeFilter.radius) return false;
        const cityCoords = SWISS_CITY_COORDS[activeFilter.city];
        if (!cityCoords) return false;
        const distance = haversineDistance(
          cityCoords.lat,
          cityCoords.lng,
          event.latitude!,
          event.longitude!
        );
        passesGeographicFilter = distance <= activeFilter.radius;
      } else if (activeFilter.type === "route") {
        if (!activeFilter.routeA || !activeFilter.routeB || !activeFilter.corridorWidth) return false;
        const coordsA = SWISS_CITY_COORDS[activeFilter.routeA];
        const coordsB = SWISS_CITY_COORDS[activeFilter.routeB];
        if (!coordsA || !coordsB) return false;
        const distance = distanceToLine(
          event.latitude!,
          event.longitude!,
          coordsA.lat,
          coordsA.lng,
          coordsB.lat,
          coordsB.lng
        );
        passesGeographicFilter = distance <= activeFilter.corridorWidth;
      }

      // Apply category filter (can be combined with geographic filter)
      let passesCategoryFilter = true;
      if (activeFilter.categoryId) {
        passesCategoryFilter = event.category_main_id === activeFilter.categoryId;
      }

      // Event must pass BOTH filters
      return passesGeographicFilter && passesCategoryFilter;
    });
  }, [events, activeFilter]);

  // Use filtered events (no fallback when filter is active)
  const displayEvents = activeFilter.type !== "none" ? filteredEvents : events;

  // Memoize day events to prevent unnecessary re-renders
  const dayEvents = useMemo(() => {
    return plannedEventsByDay[activeDay] || [];
  }, [plannedEventsByDay, activeDay]);

  // Sync startIndex when it changes (new event clicked)
  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

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
          setUserLocation({ lat: 47.3769, lng: 8.5417 });
        }
      );
    }
  }, [isOpen]);

  const currentEvent = displayEvents[currentIndex];
  const noMoreEvents = currentIndex >= displayEvents.length;

  // Calculate distance to current event
  const currentDistance = useMemo(() => {
    if (!userLocation || !currentEvent?.latitude || !currentEvent?.longitude) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, currentEvent.latitude, currentEvent.longitude);
  }, [userLocation, currentEvent]);

  // Get first tag and remaining count
  const firstTag = currentEvent?.tags?.[0];
  const remainingTagCount = (currentEvent?.tags?.length || 0) - 1;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, displayEvents.length));
    setTextExpanded(false);
    setMobileTextExpanded(false);
    setShowMenu(false);
    setShowShareMenu(false);
  }, [displayEvents.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setTextExpanded(false);
      setMobileTextExpanded(false);
      setShowMenu(false);
      setShowShareMenu(false);
    }
  }, [currentIndex]);

  const handleToggleFavorite = useCallback(() => {
    if (!currentEvent) return;
    const wasFavorite = isFavorite(currentEvent.id);

    toggleFavorite({
      id: currentEvent.id,
      slug: currentEvent.id,
      title: currentEvent.title,
      venue: currentEvent.venue_name || "",
      image: currentEvent.image_url || "",
      location: currentEvent.address_city || currentEvent.location || "",
      date: currentEvent.start_date ? new Date(currentEvent.start_date).toLocaleDateString('de-CH') : "",
      short_description: currentEvent.short_description || "",
      description: currentEvent.description || "",
      tags: currentEvent.tags || [],
      image_url: currentEvent.image_url || "",
      venue_name: currentEvent.venue_name || "",
      address_city: currentEvent.address_city || "",
      start_date: currentEvent.start_date || "",
      end_date: currentEvent.end_date || "",
      price_from: currentEvent.price_from,
      external_id: currentEvent.external_id || currentEvent.id,
      ticket_url: currentEvent.ticket_url || "",
      url: currentEvent.url || "",
      buzz_score: currentEvent.buzz_score || currentEvent.relevance_score,
    });

    if (wasFavorite) {
      toast.success("Von Favoriten entfernt", { duration: 2000, position: "top-left" });
    } else {
      toast.success("Zu Favoriten hinzugefügt", { duration: 2000, position: "top-left" });
    }
  }, [currentEvent]);

  const handleAddToTrip = useCallback(() => {
    if (!currentEvent) return;

    const inTrip = isInTrip(currentEvent.id);
    if (inTrip) {
      removeEventFromTrip(currentEvent.id);
      toast.success("Aus Tag entfernt", { duration: 2000, position: "top-left" });
    } else {
      addEventToDay(currentEvent as any, activeDay);
      toast.success("Zu Tag hinzugefügt", { duration: 2000, position: "top-left" });
    }
  }, [currentEvent, addEventToDay, removeEventFromTrip, isInTrip, activeDay]);

  const handleEventClick = useCallback((eventId: string) => {
    const index = displayEvents.findIndex(e => e.id === eventId);
    if (index >= 0) {
      // Save current position before jumping
      setPreviousIndex(currentIndex);
      setCurrentIndex(index);
      setTextExpanded(false);
      setMobileTextExpanded(false);
      setShowMenu(false);
      setShowShareMenu(false);
    }
  }, [displayEvents, currentIndex]);

  const handleGoBack = useCallback(() => {
    if (previousIndex !== null) {
      setCurrentIndex(previousIndex);
      setPreviousIndex(null);
      setTextExpanded(false);
      setMobileTextExpanded(false);
      setShowMenu(false);
      setShowShareMenu(false);
      toast.info("Zurück zur vorherigen Position", { duration: 2000, position: "top-center" });
    }
  }, [previousIndex]);

  const handleTitleClick = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileTextExpanded(prev => !prev);
    }
  }, []);

  const handleFilterApply = useCallback((criteria: FilterCriteria) => {
    setActiveFilter(criteria);
    setCurrentIndex(0); // Reset to first event when filter changes
    if (criteria.type !== "none") {
      toast.success("Filter angewendet", { duration: 2000, position: "top-center" });
    } else {
      toast.info("Filter zurückgesetzt", { duration: 2000, position: "top-center" });
    }
  }, []);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setShowMenu(false);
      setShowShareMenu(false);
      setTextExpanded(false);
      setMobileTextExpanded(false);
    }
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Keyboard navigation (mobile: vertical, desktop: horizontal)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        // Mobile: vertical navigation (up/down)
        if (e.key === 'ArrowUp') handlePrevious();
        else if (e.key === 'ArrowDown') handleNext();
        else if (e.key === 'Escape') onClose();
      } else {
        // Desktop: horizontal navigation (left/right)
        if (e.key === 'ArrowLeft') handlePrevious();
        else if (e.key === 'ArrowRight') handleNext();
        else if (e.key === 'Escape') onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  // Touch handlers (mobile: vertical swipe with Instagram-like feel, desktop: horizontal swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchEnd(null);
    setIsSwiping(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setTouchEnd(currentTouch);

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Instagram-like: card ALWAYS follows finger exactly - no conditions, no resistance!
      const deltaY = currentTouch.y - touchStart.y;
      setSwipeOffset(deltaY); // Card follows finger 1:1
    }
  };
  // Handle transition end - change index EXACTLY when animation finishes
  const handleTransitionEnd = useCallback(() => {
    if (pendingAction === 'next') {
      // Change index WITHOUT transition (to avoid jump), then reset offset
      handleNext();
      setPendingAction(null);

      // Reset offset in next frame without transition (instant, no visible movement)
      requestAnimationFrame(() => {
        setIsSwiping(true); // Disable transition
        setSwipeOffset(0);
        requestAnimationFrame(() => {
          setIsSwiping(false); // Re-enable transition
        });
      });
    } else if (pendingAction === 'prev') {
      handlePrevious();
      setPendingAction(null);

      requestAnimationFrame(() => {
        setIsSwiping(true);
        setSwipeOffset(0);
        requestAnimationFrame(() => {
          setIsSwiping(false);
        });
      });
    }
  }, [pendingAction, handleNext, handlePrevious]);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Mobile: swipe UP to next (like Instagram Reels)
      const screenHeight = window.innerHeight;
      const threshold = screenHeight * 0.2; // 20% of screen height

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < -threshold && currentIndex < displayEvents.length - 1) {
          // Swipe UP = next: animate to 100%, change index on transitionEnd
          setIsSwiping(false);
          setSwipeOffset(-screenHeight);
          setPendingAction('next');
          setTouchStart(null);
          setTouchEnd(null);
          return;
        } else if (deltaY > threshold && currentIndex > 0) {
          // Swipe DOWN = previous: animate to 100%, change index on transitionEnd
          setIsSwiping(false);
          setSwipeOffset(screenHeight);
          setPendingAction('prev');
          setTouchStart(null);
          setTouchEnd(null);
          return;
        }
      }
    } else {
      // Desktop: horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) handleNext();
        else handlePrevious();
      }
    }

    // Reset swipe state with smooth snap-back (if threshold not reached)
    setIsSwiping(false);
    setSwipeOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen) return null;

  // Location string - only city, no venue name (venue often = title for MySwitzerland)
  const locationStr = currentEvent?.latitude && currentEvent?.longitude
    ? getLocationWithMajorCity(currentEvent.latitude, currentEvent.longitude, currentEvent.address_city)
    : currentEvent?.address_city || '';

  // Date + Location info line (date only for Ticketmaster events)
  const isTicketmaster = currentEvent?.external_id?.startsWith('tm_');
  const dateStr = isTicketmaster ? formatEventDate(currentEvent?.start_date) : '';
  const infoLine = [dateStr, locationStr].filter(Boolean).join(' | ');

  // SEO slug for detail page link - MUST match sitemap generation exactly!
  // Sitemap uses: address_city || location (NO smart filtering!)
  const seoSlug = currentEvent ? generateEventSlug(currentEvent.title, currentEvent.address_city || currentEvent.location || '') : '';

  // Share functions
  const eventUrl = currentEvent ? `${window.location.origin}/event/${seoSlug}` : '';
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success("Link kopiert!");
      setShowShareMenu(false);
    } catch { toast.error("Link konnte nicht kopiert werden."); }
  };
  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${currentEvent?.title} ${eventUrl}`)}`, '_blank');
    setShowShareMenu(false);
  };
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Event: ${currentEvent?.title}`);
    const body = encodeURIComponent(`Hallo,\n\nSchau dir dieses Event an:\n${currentEvent?.title}\n\n${eventUrl}\n\nLiebe Grüsse`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const isFavorited = currentEvent ? isFavorite(currentEvent.id) : false;
  const eventInTrip = currentEvent ? isInTrip(currentEvent.id) : false;

  return (
    <div className="fixed inset-0 z-[110] bg-white md:bg-black/80 md:backdrop-blur-sm">
      {/* Blurred Background Image - DESKTOP/TABLET ONLY */}
      <div className="hidden md:block">
        {currentEvent?.image_url && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={currentEvent.image_url}
              alt=""
              className="w-full h-full object-cover scale-110"
            />
            <div className="absolute inset-0 backdrop-blur-xl bg-black/40" />
          </div>
        )}
        {!currentEvent?.image_url && <div className="absolute inset-0 bg-stone-800" />}
      </div>

      {/* Share Menu Overlay */}
      {showShareMenu && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120] flex items-end justify-center p-4 cursor-pointer"
          onClick={() => setShowShareMenu(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-[400px] shadow-2xl cursor-default mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Event teilen</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <Copy size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Link kopieren</span>
              </button>
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <Share2 size={18} className="text-green-600" />
                <span className="text-sm font-medium text-gray-800">WhatsApp</span>
              </button>
              <button
                onClick={shareViaEmail}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <Mail size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-800">E-Mail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Fullscreen swiper | Tablet/Desktop: Positioned card */}
      <div className="w-full h-full flex items-center justify-center md:items-start md:justify-start md:pt-[10vh] md:pl-[20vw] md:p-4">
        <div className="w-full h-full md:relative md:w-auto md:h-auto md:max-w-[420px] xl:max-w-[460px] 2xl:max-w-[500px]">
        {noMoreEvents ? (
          <div className="flex flex-col items-center justify-center py-20 text-white text-center">
            <p className="text-2xl font-bold mb-3">Keine weiteren Events</p>
            <p className="text-white/60 mb-8">Du hast alle Events gesehen!</p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors"
            >
              Schließen
            </button>
          </div>
        ) : currentEvent ? (
          <div className="relative w-full h-full md:w-auto md:h-auto md:mb-12">
            {/* Card Stack Effect - Desktop */}
            <div className="hidden md:block">
              {events[currentIndex + 2] && (
                <div className="absolute left-6 right-6 -bottom-8 h-10 bg-white/50 rounded-3xl" style={{ zIndex: 1 }} />
              )}
              {events[currentIndex + 1] && (
                <div className="absolute left-3 right-3 -bottom-4 h-10 bg-white/80 rounded-3xl" style={{ zIndex: 2 }} />
              )}
            </div>

            {/* Main Card - Mobile: fullscreen | Tablet/Desktop: rounded card */}
            <div
              className="relative w-full h-full bg-white md:rounded-3xl md:shadow-2xl overflow-hidden"
              style={{
                zIndex: 2,
                transform: window.innerWidth < 768 ? `translateY(${swipeOffset}px)` : 'none',
                transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTransitionEnd={handleTransitionEnd}
            >
              {/* Close Button - Top Right */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 z-20 w-11 h-11 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={22} className="text-gray-700" strokeWidth={2.5} />
              </button>

              {/* Zurück Button - Below Close Button (only if previousIndex exists) */}
              {previousIndex !== null && (
                <button
                  onClick={handleGoBack}
                  className="absolute top-14 right-2 z-20 w-11 h-11 bg-blue-500/80 hover:bg-blue-600/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                  aria-label="Zurück zur vorherigen Position"
                  title="Zurück zur vorherigen Position"
                >
                  <Undo2 size={20} className="text-white" strokeWidth={2.5} />
                </button>
              )}

              {/* Card Content - Mobile: flex-col (60% image, 40% text) | Tablet/Desktop: block */}
              <div className="h-full flex flex-col md:block">
                {/* Photo - Mobile: 60% of container height | Tablet/Desktop: framed */}
                <div className="h-[60%] md:h-auto md:p-3 md:pb-0">
                  <div className="relative h-full md:h-auto md:rounded-2xl overflow-hidden md:aspect-[4/3]">
                  <img
                    src={currentEvent.image_url || "/placeholder.jpg"}
                    alt={currentEvent.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Tag Pill - Top Left (1 tag + count) */}
                  {firstTag && (
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-white/80 backdrop-blur-sm text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl shadow-sm">
                        {firstTag.charAt(0).toUpperCase() + firstTag.slice(1)}
                      </span>
                      {remainingTagCount > 0 && (
                        <span className="bg-white/80 backdrop-blur-sm text-gray-800 text-sm font-semibold px-3 py-2 rounded-xl shadow-sm">
                          +{remainingTagCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Distance Pill - Top Right (5px weiter links) */}
                  {currentDistance !== null && (
                    <div className="absolute top-4 right-9 group">
                      <span className="bg-white/80 backdrop-blur-sm text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5">
                        <MapPin size={17} className="text-red-500" />
                        {formatDistance(currentDistance)}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 -bottom-10 right-0 whitespace-nowrap shadow-lg z-10">
                        📍 Entfernung von deinem Standort
                      </div>
                    </div>
                  )}

                  {/* 3-Dot Menu - Bottom Left of Photo - Desktop/Tablet only */}
                  <div className="hidden md:block absolute bottom-4 left-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                      }}
                      className="bg-white/80 backdrop-blur-sm rounded-xl w-10 h-10 flex items-center justify-center transition-colors shadow-sm hover:bg-white/95"
                    >
                      <MoreHorizontal size={20} className="text-gray-800" />
                    </button>
                    {showMenu && (
                      <div className="absolute bottom-12 left-0 bg-white/90 rounded-xl shadow-xl p-2 min-w-[210px] z-10">
                        {/* SEO Link to detail page */}
                        <a
                          href={`/event/${seoSlug}`}
                          className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-800 transition-colors"
                        >
                          <ExternalLink size={16} className="text-gray-500" />
                          In Detailseite öffnen
                        </a>
                        {/* Nearby filter */}
                        {onNearbyFilter && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              onClose();
                              onNearbyFilter(currentEvent.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-800 transition-colors"
                          >
                            <MapPin size={16} className="text-gray-500" />
                            Events in der Nähe
                          </button>
                        )}
                        {/* Share */}
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowShareMenu(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-800 transition-colors"
                        >
                          <Share2 size={16} className="text-gray-500" />
                          Event teilen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Floating Icon Bar - Mobile only (Right edge, centered vertically) */}
                  <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-20">
                    {/* Filter/Menu Icon */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                      }}
                      className="transition-all active:scale-95"
                      aria-label="Menü"
                    >
                      <SlidersHorizontal size={26} className="text-white drop-shadow-lg" strokeWidth={2.5} />
                    </button>

                    {/* Share Icon */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowShareMenu(true);
                      }}
                      className="transition-all active:scale-95"
                      aria-label="Teilen"
                    >
                      <Share2 size={26} className="text-white drop-shadow-lg" strokeWidth={2.5} />
                    </button>

                    {/* Heart Icon - Favorite */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleFavorite();
                      }}
                      className="transition-all active:scale-95"
                      aria-label="Favorit"
                    >
                      <Heart
                        size={26}
                        className={`drop-shadow-lg ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`}
                        strokeWidth={2.5}
                      />
                    </button>

                    {/* Plus Icon - Add to Trip (Prominent) - White when not in trip, Red when in trip */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToTrip();
                      }}
                      className="transition-all active:scale-95"
                      aria-label="In den Tag einplanen"
                    >
                      <Plus size={32} className={`drop-shadow-lg ${eventInTrip ? 'text-red-500' : 'text-white'}`} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Mobile Menu Popup (for Filter/Menu icon) */}
                  {showMenu && (
                    <div className="md:hidden absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3 z-30">
                      {/* SEO Link to detail page */}
                      <a
                        href={`/event/${seoSlug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-800 transition-colors"
                      >
                        <ExternalLink size={18} className="text-gray-500" />
                        In Detailseite öffnen
                      </a>
                      {/* Nearby filter */}
                      {onNearbyFilter && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onClose();
                            onNearbyFilter(currentEvent.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-800 transition-colors"
                        >
                          <MapPin size={18} className="text-gray-500" />
                          Events in der Nähe
                        </button>
                      )}
                    </div>
                  )}
                  </div>
                </div>

                {/* Text + Buttons Section - Mobile: 40% of container height | Tablet/Desktop: normal */}
                <div className="h-[40%] flex flex-col md:h-auto md:block md:overflow-y-auto">
                  {/* Text Content - Mobile: fixed-height, clickable to expand | Desktop: expandable */}
                  <div className="px-5 pt-4 pb-3 md:pb-2 flex-1 md:flex-none md:h-auto">
                {/* Title - Mobile: single line, click to expand | Desktop: single line with inline "mehr..." */}
                <h2
                  className={`text-lg md:text-2xl font-bold text-gray-900 uppercase tracking-tight md:cursor-default ${
                    mobileTextExpanded ? '' : 'line-clamp-1 cursor-pointer md:line-clamp-1'
                  }`}
                  onClick={handleTitleClick}
                >
                  {decodeHtml(currentEvent.title)}
                </h2>

                {/* Date | Location */}
                <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-1">
                  {infoLine || '\u00A0'}
                </p>

                {/* Description - Mobile: always 2-line height (fixed), shows full when expanded | Desktop: expandable with "mehr..." */}
                {(() => {
                  const desc = decodeHtml(currentEvent.description || "Entdecke dieses spannende Event in der Schweiz.");
                  const wouldOverflow = desc.length > 160;
                  return (
                    <>
                      {/* Mobile: Fixed 2-line height container to prevent SVG from moving */}
                      <div className="md:hidden">
                        <p className={`text-xs text-gray-600 mt-2 leading-relaxed ${mobileTextExpanded ? '' : 'line-clamp-2'}`}
                           style={mobileTextExpanded ? {} : { minHeight: '2.5rem' }}>
                          {desc}
                        </p>
                      </div>
                      {/* Desktop: Expandable with "mehr..." inline */}
                      <div className="hidden md:block">
                        <p className={`text-sm text-gray-600 mt-2 leading-relaxed ${textExpanded ? '' : 'line-clamp-2'}`}>
                          {desc}
                          {!textExpanded && wouldOverflow && (
                            <span
                              onClick={() => setTextExpanded(true)}
                              className="text-gray-400 underline cursor-pointer ml-1"
                            >
                              mehr...
                            </span>
                          )}
                        </p>
                        {textExpanded && wouldOverflow && (
                          <span
                            onClick={() => setTextExpanded(false)}
                            className="text-gray-400 underline cursor-pointer text-sm mt-1 inline-block"
                          >
                            weniger
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

                  {/* Switzerland SVG Footer - Mobile only */}
                  <div className="md:hidden pb-4 pt-2">
                    <div className="relative w-full px-5">
                      <SwissMapMobile currentEvent={currentEvent} dayEvents={dayEvents} />
                    </div>
                  </div>

                  {/* Bottom Action Bar - Desktop/Tablet only */}
                  <div className="hidden md:block px-5 pb-5 pt-5">
                <div className="flex items-stretch gap-2.5">
                  {/* Ticket Button */}
                  {(currentEvent.ticket_url || currentEvent.url) ? (
                    <a
                      href={currentEvent.ticket_url || currentEvent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Ticket size={21} className="text-red-500" />
                      Ticket
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        const query = encodeURIComponent(`${currentEvent.title} Tickets Schweiz`);
                        window.open(`https://www.google.com/search?q=${query}`, '_blank');
                      }}
                      className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Ticket size={21} className="text-red-500" />
                      Ticket
                    </button>
                  )}

                  {/* Heart - Favorite */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFavorite();
                    }}
                    className={`w-12 border rounded-xl flex items-center justify-center transition-colors ${
                      isFavorited
                        ? 'border-red-300 bg-red-50 hover:bg-red-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    title="Favorit"
                  >
                    <Heart
                      size={22}
                      className={`transition-colors ${
                        isFavorited
                          ? 'text-red-500 fill-current'
                          : 'text-gray-500'
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Next Chevron */}
                  <button
                    onClick={handleNext}
                    disabled={noMoreEvents}
                    className="w-12 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Nächstes Event"
                  >
                    <ChevronRight size={22} className="text-gray-600" strokeWidth={2} />
                  </button>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Add to Trip - Black Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToTrip();
                    }}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                      eventInTrip
                        ? 'bg-blue-900 text-white hover:bg-blue-800'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {eventInTrip ? '− AUS TAG ENTFERNEN' : '+ IN DEN TAG EINPLANEN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
            </div>

            {/* Next Card - Mobile only - FULL CARD positioned below */}
            {displayEvents[currentIndex + 1] && (() => {
              const nextEvent = displayEvents[currentIndex + 1];
              const nextLocationStr = nextEvent?.latitude && nextEvent?.longitude
                ? getLocationWithMajorCity(nextEvent.latitude, nextEvent.longitude, nextEvent.address_city)
                : nextEvent?.address_city || '';
              const nextIsTicketmaster = nextEvent?.external_id?.startsWith('tm_');
              const nextDateStr = nextIsTicketmaster ? formatEventDate(nextEvent?.start_date) : '';
              const nextInfoLine = [nextDateStr, nextLocationStr].filter(Boolean).join(' | ');
              const nextDesc = decodeHtml(nextEvent.description || "Entdecke dieses spannende Event in der Schweiz.");

              return (
                <div
                  className="md:hidden absolute top-full left-0 right-0 h-screen bg-white"
                  style={{
                    zIndex: 1,
                    transform: window.innerWidth < 768 ? `translateY(${swipeOffset}px)` : 'none',
                    transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    willChange: 'transform'
                  }}
                >
                  {/* Card Content - Same structure as current card */}
                  <div className="h-full flex flex-col">
                    {/* Photo - 60% of container height (matches main card) */}
                    <div className="h-[60%]">
                      <div className="relative h-full">
                        <img
                          src={nextEvent.image_url || "/placeholder.jpg"}
                          className="w-full h-full object-cover"
                          alt={nextEvent.title}
                        />
                      </div>
                    </div>

                    {/* Text + SVG - 40% of container height (matches main card) */}
                    <div className="h-[40%] flex flex-col">
                      <div className="px-5 pt-4 pb-3 flex-1">
                        {/* Title */}
                        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight line-clamp-1">
                          {decodeHtml(nextEvent.title)}
                        </h2>
                        {/* Date | Location */}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {nextInfoLine || '\u00A0'}
                        </p>
                        {/* Description */}
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-2" style={{ minHeight: '2.5rem' }}>
                          {nextDesc}
                        </p>
                      </div>

                      {/* SVG Map */}
                      <div className="pb-4 pt-2">
                        <div className="relative w-full px-5">
                          <SwissMapMobile currentEvent={nextEvent} dayEvents={dayEvents} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-white text-lg">Keine Events verfügbar</p>
          </div>
        )}
        </div>
      </div>

      {/* Sidebar - Tablet/Desktop only, 100% height, right edge, 25% width (1/4 screen) */}
      <div className="hidden md:flex w-[25vw] flex-shrink-0 h-screen fixed right-0 top-0">
        <SwiperSidebar
          currentEvent={currentEvent}
          onEventClick={handleEventClick}
          onFilterApply={handleFilterApply}
        />
      </div>
    </div>
  );
}
