import { useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import { Heart, RefreshCw, Car, Train, Maximize2, Minimize2, CalendarPlus, Share2, Copy, Mail, Sparkles, MapPin, ShoppingCart, Clock, ChevronRight, Star, Plus, SlidersHorizontal } from "lucide-react";
import EventsMap from "@/components/EventsMap";
import EventDetailModal from "@/components/EventDetailModal";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEventData } from "@/hooks/useEventData";
import { useEventFilters } from "@/hooks/useEventFilters";
import { getEventLocation, convertToUmlauts, getCategoryLabel, exportToCalendar, calculateDistance } from "@/utils/eventUtilities";
import { toast } from "sonner";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";

const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

interface TripStop {
  id: string;
  title: string;
  image: string;
  location: string;
  duration: number;
  rating: number;
  buzz: number;
  category: string;
  reason: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  price?: string;
  icon?: string;
  travelAfter?: {
    duration: number;
    mode?: "car" | "train" | "walk";
  };
}

interface TimelineSection {
  id: string;
  title: "Morgens" | "Mittags" | "Abends";
  timeRange: string;
  events: TripStop[];
}

interface MealSuggestion {
  id: string;
  type: "breakfast" | "lunch" | "dinner";
  suggestedTime: string;
  duration: number;
  icon: string;
  question: string;
}

const MEAL_SUGGESTIONS: MealSuggestion[] = [
  {
    id: "breakfast",
    type: "breakfast",
    suggestedTime: "09:00",
    duration: 0.5,
    icon: "☕",
    question: "Noch Zeit zum Frühstücken?"
  },
  {
    id: "lunch",
    type: "lunch",
    suggestedTime: "12:30",
    duration: 1,
    icon: "🍽️",
    question: "Noch Zeit für Mittagessen?"
  },
  {
    id: "dinner",
    type: "dinner",
    suggestedTime: "18:00",
    duration: 1.5,
    icon: "🍝",
    question: "Noch Zeit für Abendessen?"
  }
];

// Helper functions for Hourly Grid
const calculatePixelOffset = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const dayStartHour = 8;
  const totalMinutes = (hours - dayStartHour) * 60 + minutes;
  const pixelsPerMinute = 100 / 60; // 100px pro Stunde
  return totalMinutes * pixelsPerMinute;
};

const calculateHeight = (durationMinutes: number): number => {
  const pixelsPerMinute = 100 / 60; // 100px pro Stunde
  return durationMinutes * pixelsPerMinute;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}min`;
};

const getTimeOfDayColor = (timeString: string): string => {
  const hour = parseInt(timeString.split(':')[0]);
  if (hour < 12) return 'bg-gradient-to-br from-orange-500 to-orange-600';
  if (hour < 17) return 'bg-gradient-to-br from-blue-500 to-blue-600';
  return 'bg-gradient-to-br from-purple-500 to-purple-600';
};

const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// Format gap time: unter 90 min = "XX min", ab 90 min = "H:MM"
const formatGapTime = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return "0 min";

  if (totalMinutes < 90) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Calculate gap time between two events (returns minutes)
const calculateGapTime = (currentEvent: TripStop, nextEvent: TripStop): number => {
  if (!currentEvent.endTime || !nextEvent.startTime) return 0;

  // Parse current event end time
  const [endHour, endMin] = currentEvent.endTime.split(':').map(Number);
  let endTotalMinutes = endHour * 60 + endMin;

  // Add travel time
  if (currentEvent.travelAfter) {
    endTotalMinutes += currentEvent.travelAfter.duration;
  }

  // Parse next event start time
  const [startHour, startMin] = nextEvent.startTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMin;

  // Calculate gap in minutes
  const gapMinutes = startTotalMinutes - endTotalMinutes;

  return gapMinutes > 0 ? gapMinutes : 0;
};

const calculateTotalDuration = (timeline: TripStop[]): string => {
  let totalMinutes = 0;
  timeline.forEach(stop => {
    totalMinutes += stop.duration * 60;
    if (stop.travelAfter) {
      totalMinutes += stop.travelAfter.duration;
    }
  });
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

// Calculate total event hours (without travel time)
const calculateEventHours = (sections: TimelineSection[]): number => {
  let totalHours = 0;
  sections.forEach(section => {
    section.events.forEach(event => {
      totalHours += event.duration;
    });
  });
  return totalHours;
};

// Calculate total distance in km (assuming ~1km per minute of travel)
const calculateTotalDistance = (sections: TimelineSection[]): number => {
  let totalMinutes = 0;
  sections.forEach(section => {
    section.events.forEach(event => {
      if (event.travelAfter) {
        totalMinutes += event.travelAfter.duration;
      }
    });
  });
  // Assuming average speed of 40km/h in city = ~0.67km per minute
  return Math.round(totalMinutes * 0.67);
};

// Count total events
const countTotalEvents = (sections: TimelineSection[]): number => {
  return sections.reduce((count, section) => count + section.events.length, 0);
};

// Get trip start and end time
const getTripTimeRange = (sections: TimelineSection[]): { start: string; end: string } => {
  const firstSection = sections[0];
  const lastSection = sections[sections.length - 1];
  const firstEvent = firstSection?.events[0];
  const lastEvent = lastSection?.events[lastSection.events.length - 1];

  return {
    start: firstEvent?.startTime || "09:00",
    end: lastEvent?.endTime || "22:00"
  };
};

// Calculate automatic start times based on previous event end + travel time
const calculateAutoTimeline = (timeline: Omit<TripStop, 'time'>[], startTime: string = "09:00"): TripStop[] => {
  let currentMinutes = 0;
  const [startHours, startMins] = startTime.split(':').map(Number);
  currentMinutes = startHours * 60 + startMins;

  return timeline.map(stop => {
    const startHours = Math.floor(currentMinutes / 60);
    const startMins = currentMinutes % 60;
    const stopWithTime: TripStop = {
      ...stop,
      time: `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`
    };

    // Calculate next event start time
    currentMinutes += stop.duration * 60; // Add event duration
    if (stop.travelAfter) {
      currentMinutes += stop.travelAfter.duration; // Add travel time
    }

    return stopWithTime;
  });
};

// Mock timeline stops - times are auto-calculated
// Timeline Sections für das neue Design
const TIMELINE_SECTIONS: TimelineSection[] = [
  {
    id: "morning",
    title: "Morgens",
    timeRange: "09:00 - 11:30",
    events: [
      {
        id: "morning1",
        title: "Event Quanterland",
        image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400",
        location: "Monterintours",
        duration: 3,
        rating: 4.8,
        buzz: 85,
        category: "Kultur",
        reason: "Einzigartiges Kunst-Erlebnis",
        icon: "🎨",
        price: "€18",
        startTime: "09:00",
        endTime: "12:00",
        travelAfter: { duration: 15, mode: "car" }
      }
    ]
  },
  {
    id: "lunch",
    title: "Mittags",
    timeRange: "13:00 - 15:00",
    events: [
      {
        id: "lunch1",
        title: "Cangus de Damation",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
        location: "Morellenentour",
        duration: 3,
        rating: 4.8,
        buzz: 90,
        category: "Food & Drinks",
        reason: "Kulinarisches Highlight",
        icon: "🍽️",
        price: "€€",
        startTime: "13:00",
        endTime: "16:00",
        travelAfter: { duration: 20, mode: "car" }
      }
    ]
  },
  {
    id: "evening",
    title: "Abends",
    timeRange: "19:00 - 22:00",
    events: [
      {
        id: "evening1",
        title: "Vangenrestantritt Meeting",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
        location: "Monternaria",
        duration: 3,
        rating: 4.8,
        buzz: 95,
        category: "Musik",
        reason: "Unvergessliches Konzert-Erlebnis",
        icon: "🎵",
        price: "€€€",
        startTime: "19:00",
        endTime: "22:00",
        travelAfter: { duration: 20, mode: "train" }
      }
    ]
  }
];

const TripPlanerNew = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const [viewMode, setViewMode] = useState<"events" | "dayplan">("dayplan");
  const [transportMode, setTransportMode] = useState<"car" | "train">("car");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Similar & Nearby Events Filter (Amazon-style)
  const [similarEventsFilter, setSimilarEventsFilter] = useState<string | null>(null);
  const [nearbyEventsFilter, setNearbyEventsFilter] = useState<string | null>(null);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  // Share popup state per event (key: event.id, value: boolean)
  const [sharePopupStates, setSharePopupStates] = useState<Record<string, boolean>>({});

  // Calculate travel time based on transport mode
  // Car is faster in cities, train takes ~1.8x longer (waiting, walking to station, etc.)
  const getTravelTime = (baseMinutes: number) => {
    return transportMode === "car" ? baseMinutes : Math.round(baseMinutes * 1.8);
  };

  const getTravelIcon = () => {
    return transportMode === "car" ? <Car size={20} /> : <Train size={20} />;
  };

  const getTravelColor = () => {
    return transportMode === "car" ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600";
  };

  // Use shared hooks
  const { rawEvents, loading, hoveredEventId, setHoveredEventId, handleMapEventsChange } = useEventData();
  const {
    filters,
    handleCategoryChange,
    handleMoodChange,
    handleCityChange,
    handleRadiusChange,
    handleTimeChange,
    handleDateChange,
    handleSearchChange,
  } = useEventFilters();

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let result = [...rawEvents];

    // Similar Events Filter (Amazon-style) - OVERRIDE all other filters
    if (similarEventsFilter) {
      const sourceEvent = rawEvents.find(e => e.id === similarEventsFilter);
      if (sourceEvent && sourceEvent.category_main_id) {
        result = result.filter(event =>
          event.id !== similarEventsFilter && // Exclude source event
          event.category_main_id === sourceEvent.category_main_id
        );
        return result; // Return early, ignore other filters
      }
    }

    // Nearby Events Filter (Amazon-style) - OVERRIDE all other filters
    if (nearbyEventsFilter) {
      const sourceEvent = rawEvents.find(e => e.id === nearbyEventsFilter);
      if (sourceEvent && sourceEvent.latitude && sourceEvent.longitude) {
        result = result.filter(event => {
          if (event.id === nearbyEventsFilter || !event.latitude || !event.longitude) {
            return false; // Exclude source event and events without coordinates
          }
          const distance = calculateDistance(
            sourceEvent.latitude!,
            sourceEvent.longitude!,
            event.latitude,
            event.longitude
          );
          return distance <= 10; // 10km radius
        });
        return result; // Return early, ignore other filters
      }
    }

    return result;
  }, [rawEvents, similarEventsFilter, nearbyEventsFilter]);

  const handleToggleFavorite = useCallback((event: any) => {
    toggleFavorite({
      id: event.id,
      title: event.title,
      image_url: event.image_url,
      location: getEventLocation(event),
      start_date: event.start_date,
    });
  }, [toggleFavorite]);

  const isFavorited = useCallback((eventId: string) => {
    return favorites.some(fav => fav.id === eventId);
  }, [favorites]);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Helmet>
        <title>Trip Planer | EventBuzzer</title>
        <meta name="description" content="Plane deinen perfekten Tag in der Schweiz" />
      </Helmet>

      <Navbar />

      {/* Filter Bar - Nur im Events Mode oder wenn manuell geöffnet */}
      {(viewMode === "events" || showFilters) && (
        <div className="sticky top-16 z-40 bg-[#F4F7FA] border-b border-stone-200">
          <div className="mx-auto px-6 py-4">
            <ListingsFilterBar
              initialCategory={filters.category}
              initialMood={filters.mood}
              initialCity={filters.city}
              initialRadius={filters.radius}
              initialTime={filters.time}
              initialDate={filters.date}
              initialSearch={filters.search}
              onCategoryChange={handleCategoryChange}
              onMoodChange={handleMoodChange}
              onCityChange={handleCityChange}
              onRadiusChange={handleRadiusChange}
              onTimeChange={handleTimeChange}
              onDateChange={handleDateChange}
              onSearchChange={handleSearchChange}
            />
          </div>
        </div>
      )}

      {/* View Mode Switch */}
      <div className="bg-[#F4F7FA] border-b border-stone-200 sticky top-16 z-30">
        <div className="py-4" style={{paddingLeft: '205px', paddingRight: '24px'}}>
          <div className="flex items-center gap-6">
            {/* View Mode Segmented Control */}
            <div className="inline-flex rounded-lg border-2 border-gray-300 overflow-hidden bg-white">
              <button
                onClick={() => setViewMode("dayplan")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-r-2 border-gray-300",
                  viewMode === "dayplan"
                    ? "bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-300"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                Trip planen
              </button>
              <button
                onClick={() => setViewMode("events")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                  viewMode === "events"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                📍 Events
              </button>
            </div>

            {/* Transport Mode Segmented Control */}
            <div className="inline-flex rounded-lg border-2 border-gray-300 overflow-hidden bg-white">
              <button
                onClick={() => setTransportMode("car")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-r-2 border-gray-300",
                  transportMode === "car"
                    ? "bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-300"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                🚗 Auto
              </button>
              <button
                onClick={() => setTransportMode("train")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                  transportMode === "train"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                🚆 Bahn
              </button>
            </div>

            {/* Filter Toggle Button - Nur im Tag planen Modus sichtbar */}
            {viewMode === "dayplan" && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg border border-gray-300",
                  showFilters
                    ? "bg-amber-50 text-amber-700 font-semibold border-amber-300"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                <SlidersHorizontal size={16} />
                <span>Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className={cn("mx-auto", viewMode === "events" ? "container px-3 max-w-7xl py-6" : "bg-[#F4F7FA]")}>
        {viewMode === "events" ? (
          // Events Mode - Split Layout
          <div className="flex gap-8 items-start container mx-auto px-3 max-w-7xl">
            {/* Left: Content */}
            <div
              className="flex-shrink-0 transition-all duration-300"
              style={{
                width: mapExpanded ? "calc(55% - 2rem)" : "63%",
              }}
            >
              {/* Events List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
                    ))}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      Keine Events gefunden. Versuche andere Filter.
                    </p>
                  </div>
                ) : (
                  filteredEvents.map((event, index) => {
                    const location = getEventLocation(event);
                    const favorited = isFavorited(event.id);
                    const categoryLabel = getCategoryLabel(event);
                    const showSharePopup = sharePopupStates[event.id] || false;

                    // Calculate rating (simplified version)
                    const rating = event.relevance_score
                      ? Math.min(5, Math.max(3, event.relevance_score / 20))
                      : 4.0;

                    return (
                      <article
                        key={event.id}
                        data-event-id={event.id}
                        onMouseEnter={() => setHoveredEventId(event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsModalOpen(true);
                        }}
                        className="group bg-[#FDFBF7] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-stone-200 cursor-pointer"
                      >
                        <div className="flex gap-4 h-[165px]">
                          {/* Image Section */}
                          <div className={cn(
                            "relative h-[165px] flex-shrink-0 overflow-hidden transition-all duration-300",
                            mapExpanded ? "w-[246px]" : "w-[308px]"
                          )}>
                            <img
                              src={event.image_url || getPlaceholderImage(index)}
                              alt={event.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Category Badge */}
                            {categoryLabel && (
                              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-stone-700 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border border-stone-100">
                                {categoryLabel}
                              </div>
                            )}

                            {/* Gallery Dots */}
                            {event.gallery_urls && event.gallery_urls.length > 0 && (
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                                {[...Array(Math.min(event.gallery_urls.length + 1, 5))].map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full transition-colors",
                                      i === 0 ? "bg-white" : "bg-white/50"
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 px-4 pt-4 pb-3 flex flex-col justify-between min-w-0">
                            <div>
                              {/* Title - ALWAYS 1 line only */}
                              <h3 className="text-xl font-semibold text-stone-900 group-hover:text-amber-700 transition-colors mb-2 truncate leading-none font-sans">
                                {event.title}
                              </h3>

                              {/* Location - NO PIN */}
                              <div className="text-sm text-gray-500 mb-2 relative group/map">
                                {location}

                                {/* Mini-Map Tooltip */}
                                {event.latitude && event.longitude && (
                                  <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                                    <div className="bg-white p-2 rounded-xl shadow-2xl border border-stone-200 w-44 h-32 overflow-hidden">
                                      <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                                        <img
                                          src="/swiss-outline.svg"
                                          className="w-full h-full object-contain opacity-30 p-2"
                                          alt="Switzerland Map"
                                        />
                                        <div
                                          className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md animate-bounce"
                                          style={{
                                            left: `${((event.longitude - 5.95) / (10.5 - 5.95)) * 100}%`,
                                            top: `${(1 - (event.latitude - 45.8) / (47.8 - 45.8)) * 100}%`
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Short Description - AI Generated */}
                              {(() => {
                                const shortDesc = event.short_description || event.description;
                                return shortDesc ? (
                                  <p className="text-[15px] text-gray-600 leading-relaxed line-clamp-2">
                                    {convertToUmlauts(shortDesc)}
                                  </p>
                                ) : null;
                              })()}
                            </div>

                            {/* Bottom Row: Star + Icons - LEFT ALIGNED, NO BORDERS, 20px spacing */}
                            <div className="flex items-center gap-5 relative z-20">
                              {/* Star Rating */}
                              <div className="flex items-center gap-1.5 relative z-20">
                                <span className="text-yellow-400 text-lg">⭐</span>
                                <span className="text-sm font-semibold text-gray-600">
                                  {rating.toFixed(1)}
                                </span>
                              </div>

                              {/* Action Icons - NO BORDERS, simple hover, with padding */}
                              <div className="flex items-center gap-5">
                                {/* Favorit */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(event);
                                  }}
                                  className="group/heart relative p-1.5 hover:scale-110 transition-all duration-200"
                                >
                                  <Heart
                                    size={19}
                                    className={favorited ? "fill-red-600 text-red-600" : "text-gray-600"}
                                  />
                                  {/* Tooltip - Heller Stil */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/heart:block z-50 pointer-events-none">
                                    <div className="bg-[#ffffff] text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
                                      {favorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                                    </div>
                                    <div className="w-2 h-2 bg-[#ffffff] border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
                                  </div>
                                </button>

                                {/* Calendar mit Tooltip */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportToCalendar(event);
                                  }}
                                  className="group/calendar relative p-1.5 hover:scale-110 transition-all duration-200"
                                >
                                  <CalendarPlus size={18} className="text-gray-600" />
                                  {/* Tooltip - Heller Stil */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/calendar:block z-50 pointer-events-none">
                                    <div className="bg-[#ffffff] text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
                                      Im privaten Kalender speichern
                                    </div>
                                    <div className="w-2 h-2 bg-[#ffffff] border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
                                  </div>
                                </button>

                                {/* Share mit Popover - Design von EventDetail.tsx */}
                                <Popover
                                  open={showSharePopup}
                                  onOpenChange={(open) => setSharePopupStates(prev => ({ ...prev, [event.id]: open }))}
                                >
                                  <PopoverTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      className="group/share relative p-1.5 hover:scale-110 transition-all duration-200"
                                    >
                                      <Share2 size={18} className="text-gray-600" />
                                      {/* Tooltip - Heller Stil */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/share:block z-50 pointer-events-none">
                                        <div className="bg-[#ffffff] text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
                                          Event teilen
                                        </div>
                                        <div className="w-2 h-2 bg-[#ffffff] border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
                                      </div>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-56 p-2 bg-white shadow-lg border border-neutral-200"
                                    align="end"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex flex-col">
                                      {/* Link kopieren */}
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const eventUrl = `${window.location.origin}/event/${event.external_id || event.id}`;
                                            await navigator.clipboard.writeText(eventUrl);
                                            toast("Link kopiert!", { duration: 2000 });
                                            setSharePopupStates(prev => ({ ...prev, [event.id]: false }));
                                          } catch {
                                            toast("Link konnte nicht kopiert werden", { duration: 2000 });
                                          }
                                        }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                                      >
                                        <Copy size={18} className="text-neutral-500" />
                                        <span className="text-sm text-neutral-700">Link kopieren</span>
                                      </button>

                                      {/* WhatsApp */}
                                      <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Schau dir dieses Event an: ${event.title}\n${window.location.origin}/event/${event.external_id || event.id}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSharePopupStates(prev => ({ ...prev, [event.id]: false }));
                                        }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                                      >
                                        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-green-600" fill="currentColor">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                        <span className="text-sm text-neutral-700">WhatsApp</span>
                                      </a>

                                      {/* E-Mail */}
                                      <a
                                        href={`mailto:?subject=${encodeURIComponent(`Event: ${event.title}`)}&body=${encodeURIComponent(`Schau dir dieses Event an:\n\n${event.title}\n${window.location.origin}/event/${event.external_id || event.id}`)}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSharePopupStates(prev => ({ ...prev, [event.id]: false }));
                                        }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                                      >
                                        <Mail size={18} className="text-neutral-500" />
                                        <span className="text-sm text-neutral-700">E-Mail</span>
                                      </a>
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {/* Ticket kaufen */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (event.ticket_url || event.url) {
                                      window.open(event.ticket_url || event.url, '_blank');
                                    } else {
                                      toast.info("Ticket-Verkauf demnächst verfügbar");
                                    }
                                  }}
                                  className="group/ticket relative p-1.5 hover:scale-110 transition-all duration-200"
                                >
                                  <ShoppingCart size={18} className="text-gray-600" />
                                  {/* Tooltip - Heller Stil */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/ticket:block z-50 pointer-events-none">
                                    <div className="bg-[#ffffff] text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
                                      Ticket kaufen
                                    </div>
                                    <div className="w-2 h-2 bg-[#ffffff] border-r border-b border-gray-200 rotate-45 -mt-1 mx-auto" />
                                  </div>
                                </button>

                                {/* Ähnliche Events (Similar) - Amazon-style */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (similarEventsFilter === event.id) {
                                      setSimilarEventsFilter(null); // Toggle off
                                    } else {
                                      // Show loading state
                                      setIsLoadingSimilar(true);

                                      // Apply filter after 1.5 seconds
                                      setTimeout(() => {
                                        setSimilarEventsFilter(event.id);
                                        setNearbyEventsFilter(null); // Clear other filter
                                        setIsLoadingSimilar(false);
                                      }, 1500);
                                    }
                                  }}
                                  disabled={isLoadingSimilar}
                                  className={cn(
                                    "group/similar relative p-1.5 hover:scale-110 transition-all duration-200",
                                    similarEventsFilter === event.id && "text-orange-500",
                                    isLoadingSimilar && "opacity-50 cursor-wait"
                                  )}
                                >
                                  <Sparkles size={18} className={cn(
                                    similarEventsFilter === event.id ? "text-orange-500" : "text-gray-600",
                                    isLoadingSimilar && "animate-spin"
                                  )} />
                                  {/* Tooltip - Heller Stil */}
                                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/similar:block z-50 pointer-events-none">
                                    <div className="bg-[#ffffff] text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
                                      Ähnliche Events anzeigen
                                    </div>
                                    <div className="w-2 h-2 bg-[#ffffff] border-r border-b border-gray-200 rotate-45 -mt-1 mr-2" />
                                  </div>
                                </button>

                                {/* Events in der Nähe (Nearby) - Amazon-style */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (nearbyEventsFilter === event.id) {
                                      setNearbyEventsFilter(null); // Toggle off
                                    } else {
                                      // Show loading state
                                      setIsLoadingNearby(true);

                                      // Apply filter after 1.5 seconds
                                      setTimeout(() => {
                                        setNearbyEventsFilter(event.id);
                                        setSimilarEventsFilter(null); // Clear other filter
                                        setIsLoadingNearby(false);
                                      }, 1500);
                                    }
                                  }}
                                  disabled={isLoadingNearby}
                                  className={cn(
                                    "group/nearby relative p-1.5 hover:scale-110 transition-all duration-200",
                                    nearbyEventsFilter === event.id && "text-orange-500",
                                    isLoadingNearby && "opacity-50 cursor-wait"
                                  )}
                                >
                                  <MapPin size={18} className={cn(
                                    nearbyEventsFilter === event.id ? "text-orange-500" : "text-gray-600",
                                    isLoadingNearby && "animate-spin"
                                  )} />
                                  {/* Tooltip - Heller Stil */}
                                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/nearby:block z-50 pointer-events-none">
                                    <div className="bg-[#ffffff] text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
                                      Events in der Nähe anzeigen
                                    </div>
                                    <div className="w-2 h-2 bg-[#ffffff] border-r border-b border-gray-200 rotate-45 -mt-1 mr-2" />
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Map - nur für Events Mode */}
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 sticky top-36",
                mapExpanded ? "w-[45%]" : "w-[34%] mr-4"
              )}
            >
              <div
                className={cn(
                  "relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 transition-all duration-300",
                  mapExpanded ? "h-[calc(100vh-200px)] w-full" : "h-[600px] w-full"
                )}
              >
                <div className="w-full h-full">
                  <EventsMap
                  onEventsChange={handleMapEventsChange}
                  onEventClick={(eventId) => {
                    const event = filteredEvents.find(e => e.id === eventId);
                    if (event) {
                      setSelectedEvent(event);
                      setIsModalOpen(true);
                    }
                  }}
                  events={filteredEvents.map(e => ({
                    ...e,
                    isFavorite: favorites.includes(e.id)
                  }))}
                  selectedEvent={selectedEvent}
                />

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm hover:bg-white p-2.5 rounded-lg shadow-md border border-stone-200 transition-all duration-200 hover:scale-105"
                  aria-label={mapExpanded ? "Karte verkleinern" : "Karte vergrößern"}
                >
                  {mapExpanded ? (
                    <Minimize2 size={18} className="text-gray-700" />
                  ) : (
                    <Maximize2 size={18} className="text-gray-700" />
                  )}
                </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Day Plan - PRECISION & LUXURY TIMELINE DESIGN
          <div className="flex items-start" style={{background: '#F4F7FA', padding: '1rem 1rem 2rem 1rem', borderRadius: '12px', width: '100%', marginLeft: 0, marginRight: 0, gap: '35px'}}>
            {/* Left: Timeline */}
            <div
              className="flex-shrink-0 transition-all duration-300"
              style={{
                width: mapExpanded ? "calc(60% - 2rem)" : "68%",
              }}
            >
              {/* PRECISION & LUXURY TIMELINE - Mathematisch Perfekte Zentrierung */}
              <div className="relative" style={{paddingLeft: '0'}}>
                {/* GOLD-SÄULE: EXAKT 5px mit Massiv-Metalleffekt - 40px nach rechts */}
                <div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    left: '130px',
                    width: '5px',
                    background: 'linear-gradient(to right, #8B5A2B 0%, #D4AF37 25%, #FBF5E9 50%, #D4AF37 75%, #8B5A2B 100%)',
                    boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
                  }}
                />

                {/* Header - ZENTRIERT zu Event-Karten */}
                <div className="mb-2 mt-0 flex items-center justify-center gap-3" style={{marginLeft: '150px', width: '565px'}}>
                  <h2 className="text-base font-serif font-semibold text-gray-700">
                    Mein Trip
                  </h2>
                  {/* Trip Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-[#D4AF37]" />
                      <span>{calculateEventHours(TIMELINE_SECTIONS)} Std.</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Car size={14} className="text-[#D4AF37]" />
                      <span>{calculateTotalDistance(TIMELINE_SECTIONS)} km</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#D4AF37]" />
                      <span>{countTotalEvents(TIMELINE_SECTIONS)} Events</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <span>{getTripTimeRange(TIMELINE_SECTIONS).start} - {getTripTimeRange(TIMELINE_SECTIONS).end}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline Sections */}
                {TIMELINE_SECTIONS.map((section, sectionIdx) => (
                  <div key={section.id} className="mb-0">
                    {/* Section Header - LINKS von der Perlenkette */}
                    <h3 className="text-base font-serif font-bold text-gray-800 mb-2 text-right pr-3" style={{width: '125px'}}>
                      {section.title}
                    </h3>

                    {/* Events - LUFTIGES LAYOUT */}
                    <div>
                      {section.events.map((event, eventIdx) => (
                        <div key={event.id} className="relative">
                          {/* Zeitbereich - LINKS neben der Perle, mittig zur Event-Card */}
                          <div
                            className="absolute z-10 text-right pr-3"
                            style={{
                              left: '10px',
                              width: '115px',
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          >
                            <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              {section.timeRange.replace(' - ', ' – ')}
                            </div>
                          </div>

                          {/* 3D-GOLDPERLE: MITTIG der Event-Card Höhe (130px + 2.5px = 132.5px) */}
                          <div
                            className="absolute rounded-full z-20"
                            style={{
                              left: '132.5px',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '18px',
                              height: '18px',
                              background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #FBF5E9 20%, #D4AF37 60%, #8B5A2B 100%)',
                              boxShadow: '3px 3px 6px rgba(0,0,0,0.4)'
                            }}
                          />

                          {/* Timeline Item */}
                          <div className="flex items-center" style={{marginLeft: '150px'}}>

                            {/* Event Card - BREITER & LUFTIGER (+25% Breite, +15% Höhe) */}
                            <div
                              className="bg-white rounded-lg transition-all duration-300 p-4"
                              style={{
                                marginLeft: '55px',
                                width: '510px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
                              }}
                            >
                              <div className="flex gap-5">
                                {/* Event Image - POLAROID-RAHMEN (größer) */}
                                <div
                                  className="relative flex-shrink-0 bg-white p-2 rounded-sm"
                                  style={{boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}
                                >
                                  <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-40 h-28 rounded object-cover"
                                  />
                                </div>

                                {/* Event Info */}
                                <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                                  <h4 className="font-serif font-bold text-lg text-gray-900 mb-1.5">
                                    {event.title}
                                  </h4>

                                  {/* Location */}
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-0.5">
                                    <MapPin size={14} />
                                    <span>{event.location}</span>
                                  </div>

                                  {/* Duration & Rating */}
                                  <div className="flex items-center gap-4 mb-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <Clock size={14} />
                                      <span>{event.duration} Stunden</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
                                      <span className="font-semibold text-xs">{event.rating}</span>
                                    </div>
                                  </div>

                                  {/* Buzz Slider - 75% der Kartenbreite */}
                                  <div style={{maxWidth: '75%'}}>
                                    <span className="text-xs text-gray-500 mb-0.5 block">Buzz</span>
                                    <div className="relative h-2 bg-gray-200 rounded-full">
                                      <div
                                        className="absolute h-full rounded-full"
                                        style={{
                                          width: `${event.buzz}%`,
                                          background: 'linear-gradient(to right, #8B5A2B 0%, #D4AF37 25%, #FBF5E9 50%, #D4AF37 75%, #8B5A2B 100%)'
                                        }}
                                      />
                                      <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                                        style={{
                                          left: `calc(${event.buzz}% - 6px)`,
                                          background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #FBF5E9 20%, #D4AF37 60%, #8B5A2B 100%)',
                                          boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* AUTO-ELEMENT: LINKS von der Perlenkette */}
                          {event.travelAfter && (
                            <div className="relative mt-0 mb-0 h-0">
                              <div className="absolute text-right pr-3" style={{right: 'calc(100% - 125px)', width: '115px', top: '50%', transform: 'translateY(-50%)'}}>
                                <span className="text-sm font-serif text-gray-600">
                                  <Car
                                    size={14}
                                    className="text-[#D4AF37] inline-block mr-1"
                                    strokeWidth={1.5}
                                  />
                                  {event.travelAfter.duration} min Fahrt
                                </span>
                              </div>
                            </div>
                          )}

                          {/* PLUS-BUTTON Layout: Zeit links, Plus + Text ZENTRIERT rechts */}
                          {eventIdx < section.events.length - 1 && (() => {
                            const nextEvent = section.events[eventIdx + 1];
                            const gapMinutes = calculateGapTime(event, nextEvent);
                            const formattedGap = formatGapTime(gapMinutes);

                            return (
                              <div className="relative mt-1 mb-0">
                                {/* Zeit LINKS von der Perlenkette */}
                                <div className="absolute text-right pr-3" style={{right: 'calc(100% - 125px)', width: '115px', top: '50%', transform: 'translateY(-50%)'}}>
                                  <span className="text-sm font-serif text-gray-600 font-semibold">
                                    {formattedGap} Zeit
                                  </span>
                                </div>

                                {/* Plus-Button + "Event hinzufügen" ZENTRIERT zur Event-Card */}
                                <div className="flex items-center justify-center gap-2 cursor-pointer group" style={{marginLeft: '150px'}}>
                                  <div
                                    className="z-20 flex items-center justify-center transition-all hover:bg-amber-50 hover:scale-110"
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      border: '2px solid #D4AF37',
                                      borderRadius: '50%',
                                      background: 'white',
                                      flexShrink: 0
                                    }}
                                  >
                                    <Plus size={14} className="text-[#D4AF37]" strokeWidth={2.5} />
                                  </div>
                                  <span className="text-sm font-serif text-gray-600">
                                    Event hinzufügen
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>

                    {/* Plus Button zwischen Sections - Zeit links, Plus + Text rechts */}
                    {sectionIdx < TIMELINE_SECTIONS.length - 1 && (() => {
                      const lastEventInSection = section.events[section.events.length - 1];
                      const nextSection = TIMELINE_SECTIONS[sectionIdx + 1];
                      const firstEventInNextSection = nextSection.events[0];
                      const gapMinutes = calculateGapTime(lastEventInSection, firstEventInNextSection);
                      const formattedGap = formatGapTime(gapMinutes);

                      return (
                        <div className="relative mt-[27px] mb-[15px]">
                          {/* Zeit LINKS von der Perlenkette */}
                          <div className="absolute text-right pr-3" style={{right: 'calc(100% - 125px)', width: '115px', top: '50%', transform: 'translateY(-50%)'}}>
                            <span className="text-sm font-serif text-gray-600 font-semibold">
                              {formattedGap} Zeit
                            </span>
                          </div>

                          {/* Plus-Button + "Event hinzufügen" ZENTRIERT */}
                          <div className="flex items-center justify-center gap-2 cursor-pointer group" style={{marginLeft: '150px'}}>
                            <div
                              className="z-20 flex items-center justify-center transition-all hover:bg-amber-50 hover:scale-110"
                              style={{
                                width: '28px',
                                height: '28px',
                                border: '2px solid #D4AF37',
                                borderRadius: '50%',
                                background: 'white',
                                flexShrink: 0
                              }}
                            >
                              <Plus size={14} className="text-[#D4AF37]" strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-serif text-gray-600">
                              Event hinzufügen
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Map */}
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 sticky top-36",
                mapExpanded ? "w-[40%] pr-2" : "w-[29%] pr-2"
              )}
            >
              <div
                className={cn(
                  "relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 transition-all duration-300",
                  mapExpanded ? "h-[calc(100vh-200px)] w-full" : "h-[600px] w-full"
                )}
              >
                <div className="w-full h-full">
                  <EventsMap
                    events={filteredEvents.map(e => ({
                      ...e,
                      isFavorite: favorites.includes(e.id)
                    }))}
                    onEventClick={(eventId) => {
                      const event = filteredEvents.find(e => e.id === eventId);
                      if (event) {
                        setSelectedEvent(event);
                        setIsModalOpen(true);
                      }
                    }}
                    onEventsChange={handleMapEventsChange}
                    selectedEvent={selectedEvent}
                  />
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm hover:bg-white p-2.5 rounded-lg shadow-md border border-stone-200 transition-all duration-200 hover:scale-105"
                  aria-label={mapExpanded ? "Karte verkleinern" : "Karte vergrößern"}
                >
                  {mapExpanded ? (
                    <Minimize2 size={18} className="text-gray-700" />
                  ) : (
                    <Maximize2 size={18} className="text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default TripPlanerNew;
