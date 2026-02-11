/**
 * EventListSwiper - Swiper-style event viewer for the EventList page
 * Based on MagicTripSelectorSwiper design (card stack, blurred bg, compact action bar)
 * Instead of loading its own events, it receives events from the parent EventList.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, MapPin, Heart, ChevronRight, Ticket, MoreHorizontal, ExternalLink, Share2, Copy, Mail, Undo2 } from "lucide-react";
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
  const { addEventToDay, removeEventFromTrip, activeDay, isInTrip } = useTripPlanner();

  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // 3-dot menu & share
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);

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
    setShowMenu(false);
    setShowShareMenu(false);
  }, [displayEvents.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setTextExpanded(false);
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
      setShowMenu(false);
      setShowShareMenu(false);
    }
  }, [displayEvents, currentIndex]);

  const handleGoBack = useCallback(() => {
    if (previousIndex !== null) {
      setCurrentIndex(previousIndex);
      setPreviousIndex(null);
      setTextExpanded(false);
      setShowMenu(false);
      setShowShareMenu(false);
      toast.info("Zurück zur vorherigen Position", { duration: 2000, position: "top-center" });
    }
  }, [previousIndex]);

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
    }
  }, [isOpen]);

  // Keyboard navigation (mobile: vertical, desktop: horizontal)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
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

  // Touch handlers (mobile: vertical swipe, desktop: horizontal swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchEnd(null);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const isMobile = window.innerWidth < 1024; // lg breakpoint

    if (isMobile) {
      // Mobile: vertical swipe (Instagram-style)
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        if (deltaY < 0) handleNext(); // Swipe up = next
        else handlePrevious(); // Swipe down = previous
      }
    } else {
      // Desktop: horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) handleNext();
        else handlePrevious();
      }
    }
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
    <div className="fixed inset-0 z-[110]">
      {/* Blurred Background Image - DESKTOP ONLY */}
      <div className="hidden lg:block">
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

      {/* Mobile: Centered | Desktop: Left-aligned with padding */}
      <div className="flex items-center lg:items-start justify-center lg:justify-start w-full h-full p-4 lg:pt-[10vh] lg:pl-[20vw] lg:p-4">
        <div className="relative w-full max-w-[420px] md:max-w-[460px] lg:max-w-[500px]">
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
          <div className="relative w-full mb-12">
            {/* Card Stack Effect - visible below main card */}
            {events[currentIndex + 2] && (
              <div className="absolute left-6 right-6 -bottom-8 h-10 bg-white/50 rounded-3xl" style={{ zIndex: 1 }} />
            )}
            {events[currentIndex + 1] && (
              <div className="absolute left-3 right-3 -bottom-4 h-10 bg-white/80 rounded-3xl" style={{ zIndex: 2 }} />
            )}

            {/* Main Card */}
            <div
              className="relative bg-white rounded-3xl shadow-2xl overflow-hidden"
              style={{ zIndex: 3 }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
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

              {/* Photo with Frame */}
              <div className="p-3 pb-0">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
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

                  {/* 3-Dot Menu - Bottom Left of Photo */}
                  <div className="absolute bottom-4 left-4">
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
                </div>
              </div>

              {/* Text Content - expandable */}
              <div className={`px-5 pt-4 pb-2 ${textExpanded ? 'min-h-[120px]' : 'h-[120px]'}`}>
                {/* Title */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-tight line-clamp-1">
                  {decodeHtml(currentEvent.title)}
                </h2>

                {/* Date | Location */}
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {infoLine || '\u00A0'}
                </p>

                {/* Description - expandable with "mehr..." */}
                {(() => {
                  const desc = decodeHtml(currentEvent.description || "Entdecke dieses spannende Event in der Schweiz.");
                  const wouldOverflow = desc.length > 160;
                  return (
                    <>
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
                    </>
                  );
                })()}
              </div>

              {/* Bottom Action Bar */}
              <div className="px-5 pb-5 pt-5">
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
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-white text-lg">Keine Events verfügbar</p>
          </div>
        )}
      </div>

      </div>

      {/* Sidebar - Desktop only, 100% height, right edge, 25% width (1/4 screen) */}
      <div className="hidden lg:flex w-[25vw] flex-shrink-0 h-screen fixed right-0 top-0">
        <SwiperSidebar
          currentEvent={currentEvent}
          onEventClick={handleEventClick}
          onFilterApply={handleFilterApply}
        />
      </div>
      </div>
    </div>
  );
}
