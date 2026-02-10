/**
 * Magic Trip Selector Swiper
 * Interactive swiper for discovering and selecting events
 * Redesigned: Card stack effect, blurred background, compact action bar
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, MapPin, Heart, ChevronRight, Ticket, MoreHorizontal, ExternalLink, Share2, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { haversineDistance, SWISS_CITY_COORDS, distanceToLine } from "@/utils/geoHelpers";
import { getLocationWithMajorCity } from "@/utils/swissPlaces";
import { generateEventSlug, getEventLocation } from "@/utils/eventUtilities";
import SwiperSidebar, { FilterCriteria } from "@/components/SwiperSidebar";

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
  ticket_link?: string;
  external_id?: string;
  location?: string;
}

interface MagicTripSelectorSwiperProps {
  isOpen: boolean;
  onClose: () => void;
  activeDay: number;
  onEventSelected: (event: Event) => void;
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
  const [cachedNearbyEvents, setCachedNearbyEvents] = useState<Event[]>([]);

  // Favorites state
  const [favoritedEventIds, setFavoritedEventIds] = useState<Set<string>>(new Set());

  // Added to trip state
  const [addedToTripIds, setAddedToTripIds] = useState<Set<string>>(new Set());

  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // 3-dot menu & share
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterCriteria>({ type: "none" });

  // Filtered events based on active filter
  const filteredEvents = useMemo(() => {
    const sourceEvents = nearbyFilterActive ? cachedNearbyEvents : allEvents;
    if (activeFilter.type === "none") return sourceEvents;

    return sourceEvents.filter(event => {
      if (!event.latitude || !event.longitude) return false;

      switch (activeFilter.type) {
        case "city": {
          if (!activeFilter.city || !activeFilter.radius) return false;
          const cityCoords = SWISS_CITY_COORDS[activeFilter.city];
          if (!cityCoords) return false;
          const distance = haversineDistance(
            cityCoords.lat,
            cityCoords.lng,
            event.latitude,
            event.longitude
          );
          return distance <= activeFilter.radius;
        }

        case "route": {
          if (!activeFilter.routeA || !activeFilter.routeB || !activeFilter.corridorWidth) return false;
          const coordsA = SWISS_CITY_COORDS[activeFilter.routeA];
          const coordsB = SWISS_CITY_COORDS[activeFilter.routeB];
          if (!coordsA || !coordsB) return false;
          const distance = distanceToLine(
            event.latitude,
            event.longitude,
            coordsA.lat,
            coordsA.lng,
            coordsB.lat,
            coordsB.lng
          );
          return distance <= activeFilter.corridorWidth;
        }

        case "category": {
          if (!activeFilter.categoryId) return false;
          return event.category_main_id === activeFilter.categoryId;
        }

        default:
          return true;
      }
    });
  }, [allEvents, cachedNearbyEvents, nearbyFilterActive, activeFilter]);

  // Use filtered events
  const availableEvents = filteredEvents.length > 0 ? filteredEvents : (nearbyFilterActive ? cachedNearbyEvents : allEvents);

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

        const dateBoundCategories = [1, 4, 7, 9, 13, 14];
        const excludedTitles = ['disc golf', 'meringues', 'von tisch zu tisch'];

        let events = (response.data.events as Event[]).filter((e) => {
          if (!e.latitude || !e.longitude || !e.start_date) return false;
          if (dateBoundCategories.includes(e.category_main_id || 0)) return false;
          if (excludedTitles.some(title => e.title?.toLowerCase() === title.toLowerCase())) return false;

          const eventDate = new Date(e.start_date);
          const month = eventDate.getMonth() + 1;
          const titleLower = e.title?.toLowerCase() || '';
          const isChristmasEvent = titleLower.includes('weihnacht') || titleLower.includes('noël') || titleLower.includes('noel');
          if (isChristmasEvent && (month < 11 || month > 12)) return false;

          return true;
        });

        events.sort((a, b) => {
          const aIsMustSee = a.tags?.includes('must-see') ? 1 : 0;
          const bIsMustSee = b.tags?.includes('must-see') ? 1 : 0;
          if (aIsMustSee !== bIsMustSee) return bIsMustSee - aIsMustSee;
          return (b.buzz_score || 0) - (a.buzz_score || 0);
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

  const currentEvent = availableEvents[currentIndex];

  // Calculate distance to current event
  const currentDistance = useMemo(() => {
    if (!userLocation || !currentEvent?.latitude || !currentEvent?.longitude) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, currentEvent.latitude, currentEvent.longitude);
  }, [userLocation, currentEvent]);

  // Get first tag and remaining count
  const firstTag = currentEvent?.tags?.[0];
  const remainingTagCount = (currentEvent?.tags?.length || 0) - 1;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setTextExpanded(false);
    setShowMenu(false);
    setShowShareMenu(false);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setTextExpanded(false);
      setShowMenu(false);
      setShowShareMenu(false);
    }
  }, [currentIndex]);

  const handleAddToTrip = useCallback(() => {
    if (!currentEvent) return;

    setAddedToTripIds(prev => {
      const updated = new Set(prev);
      const wasAdded = updated.has(currentEvent.id);

      if (wasAdded) {
        updated.delete(currentEvent.id);
        toast.success("Aus Tag entfernt", { duration: 2000, position: "top-left" });
      } else {
        updated.add(currentEvent.id);
        onEventSelected(currentEvent);
        toast.success("Zu Tag hinzugefügt", { duration: 2000, position: "top-left" });
      }
      return updated;
    });
  }, [currentEvent, onEventSelected, activeDay]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentEvent) return;

    setFavoritedEventIds(prev => {
      const updated = new Set(prev);
      const wasFavorited = prev.has(currentEvent.id);
      if (wasFavorited) updated.delete(currentEvent.id);
      else updated.add(currentEvent.id);
      return updated;
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Bitte melde dich an, um Favoriten zu speichern");
        setFavoritedEventIds(prev => {
          const updated = new Set(prev);
          const wasFavorited = prev.has(currentEvent.id);
          if (wasFavorited) updated.add(currentEvent.id);
          else updated.delete(currentEvent.id);
          return updated;
        });
        return;
      }

      const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('event_id', currentEvent.id);
      const isFavorited = (data?.length ?? 0) > 0;

      if (isFavorited) {
        try {
          await (supabase as any).from('favorites').delete().eq('user_id', user.id).eq('event_id', currentEvent.id);
          toast.success("Aus Favoriten entfernt");
        } catch (err) {
          console.warn("Could not remove from favorites:", err);
        }
      } else {
        try {
          await (supabase as any).from('favorites').insert({ user_id: user.id, event_id: currentEvent.id });
          toast.success("Zu Favoriten hinzugefügt");
        } catch (err) {
          console.warn("Could not add to favorites:", err);
        }
      }
    } catch (error) {
      console.warn('Error toggling favorite:', error);
    }
  }, [currentEvent]);

  const handleNearbyFilter = useCallback(() => {
    if (!currentEvent) return;

    if (nearbyFilterActive && nearbyFilterEventId === currentEvent.id) {
      setNearbyFilterActive(false);
      setNearbyFilterEventId(null);
      setCachedNearbyEvents([]);
      setCurrentIndex(0);
      toast.info("Nearby-Filter deaktiviert");
    } else {
      if (!currentEvent.latitude || !currentEvent.longitude) {
        toast.error("Event hat keine GPS-Koordinaten");
        return;
      }

      const eventsWithDistance = allEvents.map(event => ({
        event,
        distance: haversineDistance(currentEvent.latitude!, currentEvent.longitude!, event.latitude || 0, event.longitude || 0),
      }));

      let nearbyEvents = eventsWithDistance.filter(item => item.distance <= 10);
      if (nearbyEvents.length < 10) {
        nearbyEvents = eventsWithDistance.filter(item => item.distance <= 30);
      }

      nearbyEvents.sort((a, b) => {
        const aIsMustSee = a.event.tags?.includes('must-see') ? 1 : 0;
        const bIsMustSee = b.event.tags?.includes('must-see') ? 1 : 0;
        if (aIsMustSee !== bIsMustSee) return bIsMustSee - aIsMustSee;
        const weightedA = ((a.event.buzz_score || 0) * 0.6) - (a.distance * 0.4);
        const weightedB = ((b.event.buzz_score || 0) * 0.6) - (b.distance * 0.4);
        return weightedB - weightedA;
      });

      const cachedEvents = nearbyEvents.map(item => item.event);
      setCachedNearbyEvents(cachedEvents);
      setNearbyFilterActive(true);
      setNearbyFilterEventId(currentEvent.id);
      setCurrentIndex(0);
      toast.success(`Zeige ${cachedEvents.length} Events in der Nähe`);
    }
  }, [currentEvent, nearbyFilterActive, nearbyFilterEventId, allEvents]);

  const handleEventClick = useCallback((eventId: string) => {
    const index = availableEvents.findIndex(e => e.id === eventId);
    if (index >= 0) {
      setCurrentIndex(index);
      setTextExpanded(false);
      setShowMenu(false);
      setShowShareMenu(false);
    }
  }, [availableEvents]);

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
      if (e.key === 'ArrowLeft') handlePrevious();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  // Touch handlers
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
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) handleNext(); // Swipe left → next
      else handlePrevious(); // Swipe right → previous
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen) return null;

  const noMoreEvents = currentIndex >= availableEvents.length;

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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
      {/* Blurred Background Image */}
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

      {/* Main Content + Sidebar */}
      <div className="flex items-start w-full h-full">
      <div className="flex-1 flex items-start justify-start pt-[10vh] pl-[20vw]">
      <div className="relative w-full max-w-[420px] md:max-w-[460px] lg:max-w-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white text-lg font-medium">Events werden geladen...</p>
          </div>
        ) : noMoreEvents ? (
          <div className="flex flex-col items-center justify-center py-20 text-white text-center">
            <p className="text-2xl font-bold mb-3">
              {nearbyFilterActive ? "Keine Events in der Nähe" : "Keine weiteren Events"}
            </p>
            <p className="text-white/60 mb-8">
              {nearbyFilterActive ? "Deaktiviere den Filter, um mehr zu sehen" : "Du hast alle Events gesehen!"}
            </p>
            {nearbyFilterActive && (
              <button
                onClick={() => {
                  setNearbyFilterActive(false);
                  setNearbyFilterEventId(null);
                  setCachedNearbyEvents([]);
                  setCurrentIndex(0);
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg mb-3"
              >
                Filter aufheben
              </button>
            )}
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
            {availableEvents[currentIndex + 2] && (
              <div className="absolute left-6 right-6 -bottom-8 h-10 bg-white/50 rounded-3xl" style={{ zIndex: 1 }} />
            )}
            {availableEvents[currentIndex + 1] && (
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
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            handleNearbyFilter();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors ${
                            nearbyFilterActive ? 'text-blue-600' : 'text-gray-800'
                          }`}
                        >
                          <MapPin size={16} className={nearbyFilterActive ? 'text-blue-500' : 'text-gray-500'} />
                          Events in der Nähe
                        </button>
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
                  // Check if text would overflow 2 lines (rough estimate: ~80-100 chars per line at this size)
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
                  {/* Ticket Button - always visible */}
                  {currentEvent.ticket_link ? (
                    <a
                      href={currentEvent.ticket_link}
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
                      favoritedEventIds.has(currentEvent.id)
                        ? 'border-red-300 bg-red-50 hover:bg-red-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    title="Favorit"
                  >
                    <Heart
                      size={22}
                      className={`transition-colors ${
                        favoritedEventIds.has(currentEvent.id)
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
                      addedToTripIds.has(currentEvent.id)
                        ? 'bg-blue-900 text-white hover:bg-blue-800'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {addedToTripIds.has(currentEvent.id) ? '− AUS TAG ENTFERNEN' : '+ IN DEN TAG EINPLANEN'}
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
