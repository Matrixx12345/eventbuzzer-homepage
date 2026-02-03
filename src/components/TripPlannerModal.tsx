import React, { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
import { X, Plus, Sparkles, Briefcase, ChevronUp, ChevronDown, Trash2, Heart, MapPin, QrCode, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EventDetailModal } from './EventDetailModal';
import { useFavorites } from '@/contexts/FavoritesContext';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  image_url?: string;
  location?: string;
  address_city?: string;
  external_id?: string;
  category_main_id?: string;
  latitude?: number;
  longitude?: number;
  short_description?: string;
  description?: string;
  venue_name?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  price_from?: number;
  ticket_url?: string;
  url?: string;
  buzz_score?: number;
}

// Multi-day Trip Planner - events organized by day
type PlannedEventsByDay = Record<number, Array<{
  eventId: string;
  event: Event;
  duration: number;
  startTime?: string;
}>>;

interface TripPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEvents?: Event[];
  isFlipped?: boolean;
  plannedEventsByDay?: PlannedEventsByDay;
  onSetPlannedEventsByDay?: (events: PlannedEventsByDay) => void;
  // Tag navigation
  activeDay?: number;
  setActiveDay?: (day: number) => void;
  totalDays?: number;
  setTotalDays?: (days: number) => void;
}

// Filter pills oben
const FILTER_OPTIONS = [
  { id: 'wake_time', label: 'Wann aufstehen?' },
  { id: 'hotel', label: 'Wo ist das Hotel?' },
  { id: 'vibe', label: 'Welcher Vibe?' },
];

// Timeline slots mit Zeitpunkten
const TIME_POINTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '20:00'];

// Helper: Detect if event is museum
const isMuseumEvent = (event: Event): boolean => {
  const museumKeywords = ['museum', 'galerie', 'gallery', 'kunstmuseum', 'art museum'];
  const title = event.title.toLowerCase();
  return museumKeywords.some(keyword => title.includes(keyword));
};

// FavoritesBackSide component
interface FavoritesBackSideProps {
  onFlipBack: () => void;
  favorites: any[];
  onEventClick: (event: Event) => void;
  onAddToTrip: (event: Event) => void;
  plannedEventsByDay: PlannedEventsByDay;
}

const FavoritesBackSide: React.FC<FavoritesBackSideProps> = ({
  onFlipBack,
  favorites,
  onEventClick,
  onAddToTrip,
  plannedEventsByDay,
}) => {
  const { toggleFavorite } = useFavorites();

  return (
    <div className="w-full h-auto bg-white flex flex-col p-6 rounded-lg">
      {/* Header with centered title and back button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-500">Favoriten</h2>
        <button
          onClick={onFlipBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
          title="Zurück zum Tagesplaner"
        >
          <ArrowLeft size={18} />
          <span>Zurück zum Tagesplaner</span>
        </button>
      </div>

      {/* Favorites List */}
      <div className="overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Heart size={48} className="mb-4" />
            <p className="text-lg font-medium">Keine Favoriten gespeichert</p>
            <p className="text-sm">Speichere Events mit dem Herz-Symbol</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => {
              const isInTrip = Object.values(plannedEventsByDay).flat().some(pe => pe.eventId === favorite.id);
              return (
                <div
                  key={favorite.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all group cursor-pointer"
                  onClick={() => onEventClick(favorite)}
                >
                  {/* Event Image */}
                  <div className="relative overflow-hidden bg-gray-100 w-24 h-20 rounded flex-shrink-0">
                    {favorite.image ? (
                      <img
                        src={favorite.image}
                        alt={favorite.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Heart size={16} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {favorite.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {favorite.location || favorite.venue}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {favorite.buzz_score && (
                        <span className="text-xs font-medium text-gray-700">
                          ⭐ {favorite.buzz_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(favorite);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Aus Favoriten entfernen"
                    >
                      <Heart size={16} className="fill-red-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-all"
                      title="Zu Tag 1 hinzufügen"
                    >
                      + Tag 1
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-all"
                      title="Zu Tag 2 hinzufügen"
                    >
                      + Tag 2
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Event Slot for Trip Planner - with reorder buttons
const EventSlot: React.FC<{
  timePoint: string;
  slotId: string;
  event: Event | null;
  duration?: number;
  onRemove: () => void;
  onSelectEvent: (slotId: string, event: Event) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  allEvents: Event[];
  slotIndex?: number;
  onDragStart?: (index: number) => void;
  onDrop?: (targetIndex: number) => void;
  onEventClick?: (event: Event) => void;
}> = ({
  timePoint,
  slotId,
  event,
  duration,
  onRemove,
  onSelectEvent,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  allEvents,
  slotIndex = 0,
  onDragStart,
  onDrop,
  onEventClick
}) => {
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDurationTooltip, setShowDurationTooltip] = useState(false);

  return (
    <div className="relative flex items-center gap-3 mb-6 group">
      {/* Backdrop to close popups when clicking outside */}
      {showHelpPopup && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowHelpPopup(false);
          }}
        />
      )}

      {/* Time Label - LEFT */}
      <div className="flex-shrink-0 w-12 text-right text-xs font-semibold text-gray-600">
        {timePoint}
      </div>

      {/* Timeline Dot - MIDDLE, centered vertically */}
      <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gray-400 z-10 self-center" style={{ marginLeft: '1.25px' }} />

      {/* Event Slot - RIGHT, centered */}
      <div
        draggable={event ? true : false}
        onDragStart={(e) => {
          if (event && onDragStart) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', slotIndex.toString());
            onDragStart(slotIndex);
          }
        }}
        onDragOver={(e) => {
          if (event) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setIsDragOver(true);
          }
        }}
        onDragLeave={() => {
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (onDrop) {
            onDrop(slotIndex);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`p-2 rounded-lg border-2 ${event ? 'border-solid' : 'border-dashed'} transition-all min-h-12 flex items-center justify-center w-72 mx-auto cursor-pointer relative ${
          isDragOver ? 'border-blue-400 bg-blue-50' : event ? 'border-gray-500 bg-white hover:border-gray-500' : 'border-gray-300 hover:bg-white'
        }`}
      >
        {event ? (
          <div className="w-full flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                if (onEventClick) {
                  onEventClick(event);
                }
              }}
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate text-left">
                  {event.title}
                </p>
                {(event.location || event.address_city) && (
                  <p className="text-xs text-gray-900 truncate text-left">
                    {event.location || event.address_city}
                  </p>
                )}
                {duration && (
                  <div className="relative mt-2">
                    <button
                      className="block px-2.5 py-0.5 rounded-full bg-white text-xs text-gray-700 font-medium cursor-help hover:bg-gray-50 transition-all border border-gray-200 mt-1"
                      onMouseEnter={() => setShowDurationTooltip(true)}
                      onMouseLeave={() => setShowDurationTooltip(false)}
                    >
                      {duration >= 90 ? (
                        duration % 60 > 0 ? `${Math.floor(duration / 60)}h ${duration % 60} min` : `${Math.floor(duration / 60)} Stunden`
                      ) : (
                        `${duration} min`
                      )}
                    </button>

                    {showDurationTooltip && (
                      <div className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50">
                        geschätzte Dauer: {duration >= 90 ? (
                          duration % 60 > 0 ? `${Math.floor(duration / 60)}h ${duration % 60} min` : `${Math.floor(duration / 60)} Stunden`
                        ) : (
                          `${duration} min`
                        )}
                        <div className="absolute top-full left-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - RIGHT side, stacked vertically */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Event entfernen"
              >
                <X size={16} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMoveUp) onMoveUp();
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
                title="Nach oben verschieben"
              >
                <ChevronUp size={16} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMoveDown) onMoveDown();
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
                title="Nach unten verschieben"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHelpPopup(!showHelpPopup);
              }}
              className="hover:text-gray-600 transition-colors"
            >
              <Plus size={20} />
            </button>

            {/* Help Popup Guide */}
            {showHelpPopup && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHelpPopup(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-gray-700">
                    <p className="text-sm leading-relaxed">
                      Klicke auf das{' '}
                      <Briefcase size={16} className="text-gray-700 inline align-text-bottom mx-0.5" />
                      Symbol in der Event-Liste
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3 text-sm text-gray-600">
                    <p className="text-xs text-gray-500 mb-1">Alternative:</p>
                    <p>Oder nutze KI-Vorschläge</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};


export const TripPlannerModal: React.FC<TripPlannerModalProps> = ({
  isOpen,
  onClose,
  allEvents = [],
  isFlipped = false,
  plannedEventsByDay: propPlannedEventsByDay,
  onSetPlannedEventsByDay,
  activeDay = 1,
  setActiveDay,
  totalDays = 2,
  setTotalDays,
}) => {
  // Use props if provided, otherwise use local state
  const [localPlannedEventsByDay, setLocalPlannedEventsByDay] = useState<PlannedEventsByDay>({ 1: [], 2: [] });
  const plannedEventsByDay = propPlannedEventsByDay || localPlannedEventsByDay;
  const setPlannedEventsByDay = onSetPlannedEventsByDay || setLocalPlannedEventsByDay;

  // Get current day's events for rendering
  // Memoize currentDayEvents to prevent render loops
  const currentDayEvents = useMemo(
    () => plannedEventsByDay[activeDay] || [],
    [plannedEventsByDay, activeDay]
  );

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | null>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [isFlippedLocal, setIsFlippedLocal] = useState(false);
  const [qrCodeUrl, setShowQRCode] = useState<string | null>(null);

  // Get favorites context
  const { favorites, toggleFavorite } = useFavorites();

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newDayEvents = [...currentDayEvents];
    const draggedEvent = newDayEvents[draggedIndex];

    // Remove from old position
    newDayEvents.splice(draggedIndex, 1);
    // Insert at new position
    newDayEvents.splice(targetIndex, 0, draggedEvent);

    const updated = {
      ...plannedEventsByDay,
      [activeDay]: newDayEvents
    };
    setPlannedEventsByDay(updated);
    setDraggedIndex(null);
  }, [draggedIndex, currentDayEvents, activeDay, plannedEventsByDay, setPlannedEventsByDay]);

  // Reorder handlers
  const handleMoveEventUp = useCallback((index: number) => {
    if (index <= 0) return;
    const newDayEvents = [...currentDayEvents];
    [newDayEvents[index], newDayEvents[index - 1]] = [newDayEvents[index - 1], newDayEvents[index]];
    const updated = {
      ...plannedEventsByDay,
      [activeDay]: newDayEvents
    };
    setPlannedEventsByDay(updated);
  }, [currentDayEvents, activeDay, plannedEventsByDay, setPlannedEventsByDay]);

  const handleMoveEventDown = useCallback((index: number) => {
    if (index >= currentDayEvents.length - 1) return;
    const newDayEvents = [...currentDayEvents];
    [newDayEvents[index], newDayEvents[index + 1]] = [newDayEvents[index + 1], newDayEvents[index]];
    const updated = {
      ...plannedEventsByDay,
      [activeDay]: newDayEvents
    };
    setPlannedEventsByDay(updated);
  }, [currentDayEvents, activeDay, plannedEventsByDay, setPlannedEventsByDay]);

  const handleRemoveEvent = useCallback((slotIndex: number) => {
    const newDayEvents = currentDayEvents.filter((_, i) => i !== slotIndex);
    const updated = {
      ...plannedEventsByDay,
      [activeDay]: newDayEvents
    };
    setPlannedEventsByDay(updated);
  }, [currentDayEvents, activeDay, plannedEventsByDay, setPlannedEventsByDay]);

  // Handler to add favorited event to trip planner
  const handleAddFavoriteToTrip = useCallback((event: Event) => {
    // Check all days
    const isInTrip = Object.values(plannedEventsByDay).flat().some(pe => pe.eventId === event.id);
    if (!isInTrip) {
      const isMuseum = isMuseumEvent(event);
      const defaultDuration = isMuseum ? 150 : 120;

      const updated = {
        ...plannedEventsByDay,
        [activeDay]: [...currentDayEvents, {
          eventId: event.id,
          event: event,
          duration: defaultDuration
        }]
      };
      setPlannedEventsByDay(updated);
      toast.success(`${event.title} zu Tag ${activeDay} hinzugefügt`);
    }
  }, [plannedEventsByDay, activeDay, currentDayEvents, setPlannedEventsByDay]);

  // Helper to get location name with proper fallbacks
  const getLocationName = (event: Event): string => {
    return (
      event.title ||
      event.venue_name ||
      event.address_city ||
      event.location ||
      `Location ${event.latitude}, ${event.longitude}`
    );
  };

  // Handler to generate Google Maps URL
  const generateGoogleMapsUrl = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay || {}).flat();
    const validEvents = allEvents.filter(pe => pe && pe.event);

    // Extract coordinates from planned events
    const coordinates: Array<{ lat: number; lng: number; title: string }> = [];
    validEvents.forEach((plannedEvent) => {
      const event = plannedEvent.event;
      if (event.latitude && event.longitude) {
        coordinates.push({
          lat: event.latitude,
          lng: event.longitude,
          title: getLocationName(event)
        });
      }
    });

    if (coordinates.length < 2) {
      return null;
    }

    // Format with event names so they show in Google Maps
    const originName = encodeURIComponent(coordinates[0].title);
    const originCoords = `${coordinates[0].lat},${coordinates[0].lng}`;
    const origin = `${originName}|${originCoords}`;

    const destName = encodeURIComponent(coordinates[coordinates.length - 1].title);
    const destCoords = `${coordinates[coordinates.length - 1].lat},${coordinates[coordinates.length - 1].lng}`;
    const destination = `${destName}|${destCoords}`;

    const waypoints = coordinates
      .slice(1, -1)
      .map((coord) => {
        const name = encodeURIComponent(coord.title);
        return `${name}|${coord.lat},${coord.lng}`;
      })
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1`;
    url += `&origin=${origin}`;
    url += `&destination=${destination}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    url += `&travelmode=driving`;

    return url;
  }, [plannedEventsByDay]);

  // Handler to export route to Google Maps
  const handleExportToGoogleMaps = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay || {}).flat();
    const validEvents = allEvents.filter(pe => pe && pe.event);

    if (validEvents.length < 2) {
      toast.error('Mindestens 2 Events erforderlich');
      return;
    }

    // Extract coordinates from planned events
    const coordinates: Array<{ lat: number; lng: number; title: string }> = [];
    validEvents.forEach((plannedEvent) => {
      const event = plannedEvent.event;
      if (event.latitude && event.longitude) {
        coordinates.push({
          lat: event.latitude,
          lng: event.longitude,
          title: getLocationName(event)
        });
      } else {
        console.warn(`⚠️ Event "${event.title}" hat keine Koordinaten`);
      }
    });

    if (coordinates.length < 2) {
      toast.error(`Nur ${coordinates.length} Event(s) mit Koordinaten gefunden. Mindestens 2 erforderlich.`);
      return;
    }

    const url = generateGoogleMapsUrl();
    if (!url) {
      toast.error('Route konnte nicht generiert werden');
      return;
    }

    console.log('🗺️ Generated Maps URL:', url);

    // For mobile: try to open Google Maps app first, fallback to web
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    window.open(url, '_blank');
    toast.success(isMobile ? 'Google Maps wird geöffnet...' : 'Google Maps geöffnet!');
  }, [plannedEventsByDay, generateGoogleMapsUrl]);

  // Handler to show QR code or open maps
  const handleShowQRCode = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay || {}).flat();
    const validEvents = allEvents.filter(pe => pe && pe.event);

    if (validEvents.length < 2) {
      toast.error('Mindestens 2 Events erforderlich');
      return;
    }

    const url = generateGoogleMapsUrl();
    if (!url) {
      toast.error('Route konnte nicht generiert werden');
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile: Open Google Maps directly
      window.open(url, '_blank');
      toast.success('Google Maps wird geöffnet...');
    } else {
      // On desktop: Show QR code modal
      setShowQRCode(url);
    }
  }, [plannedEventsByDay, generateGoogleMapsUrl]);

  // Handler to export trip as PDF with QR code and timeline layout
  const handleExportPDF = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay || {}).flat();
    const validEvents = allEvents.filter(pe => pe && pe.event);

    if (validEvents.length < 2) {
      toast.error('Mindestens 2 Events erforderlich');
      return;
    }

    const url = generateGoogleMapsUrl();
    if (!url) {
      toast.error('Route konnte nicht generiert werden');
      return;
    }

    // Generate QR code URL (200x200 for PDF)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

    // Create PDF content HTML
    const todayDate = new Date().toLocaleDateString('de-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Helper to truncate description at first sentence
    const truncateAtFirstSentence = (text: string): string => {
      if (!text) return '';
      const match = text.match(/^[^.!?]*[.!?]/);
      return match ? match[0] : text;
    };

    // Helper to format duration - no emoji
    const formatDuration = (minutes: number): string => {
      if (!minutes) return '2h';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
      if (hours > 0) return `${hours}h`;
      return `${mins}min`;
    };

    // Group events by day from plannedEventsByDay structure
    const daysCount = totalDays || 1;

    // Generate HTML for all days with timeline layout
    const daysHTML = Array.from({ length: daysCount }, (_, dayIndex) => {
      const dayNumber = dayIndex + 1;
      const dayLabel = `Tag ${dayNumber}`;
      const dayEvents = plannedEventsByDay?.[dayNumber] || [];
      const validDayEvents = dayEvents.filter(pe => pe && pe.event);

      if (validDayEvents.length === 0) return '';

      return `
        <div class="day-section">
          <div class="day-title">${dayLabel}</div>
          ${validDayEvents.map((pe) => {
            const shortDesc = pe.event.short_description || pe.event.description || '';
            const truncatedDesc = truncateAtFirstSentence(shortDesc);
            const location = pe.event.address_city || pe.event.location || 'Location';
            const imageUrl = pe.event.image_url || '';
            const time = pe.startTime || '09:00';
            const durationFormatted = formatDuration(pe.duration);

            return `
              <div class="event-item">
                <!-- Zone 1: Thumbnail (4:3) -->
                <div class="event-thumb">
                  ${imageUrl ? `<img src="${imageUrl}" alt="${pe.event.title}">` : ''}
                </div>
                <!-- Zone 2: Zeit (für Screen - wird in Print oben angezeigt) -->
                <div class="event-time">
                  <div>${time}</div>
                </div>
                <!-- Zone 3: Trennlinie -->
                <div class="event-separator"></div>
                <!-- Zone 4: Textblock mit Zeit oben (Print) -->
                <div class="event-content">
                  <div class="event-time-header">${time}</div>
                  <div class="event-title-line">${pe.event.title} | ${location}</div>
                  ${truncatedDesc ? `<div class="event-description">${truncatedDesc}</div>` : ''}
                  <div class="event-duration">${durationFormatted}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Trip Planner - EventBuzzer</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 40px;
              color: #1f2937;
              background: #f9f9f9;
              line-height: 1.6;
            }

            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              padding: 75px;
              border-radius: 8px;
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            }

            /* HEADER */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 50px;
              gap: 30px;
            }

            .logo-text {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 40px;
              font-weight: 400;
              color: #1f2937;
              margin: 0;
              letter-spacing: 4px;
              flex: 1;
            }

            /* QR Container - Rechts */
            .qr-container {
              display: flex;
              flex-direction: row;
              align-items: flex-start;
              gap: 5px;
              flex-shrink: 0;
              margin-right: 20px;
              height: 90px;
            }

            .qr-code {
              width: 90px;
              height: 90px;
              border: none;
              border-radius: 0px;
              display: block;
              flex-shrink: 0;
            }

            .qr-text {
              text-align: left;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 90px;
              gap: 0;
              padding: 0;
              margin: 0;
            }

            .qr-text strong {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 14px;
              font-weight: 400;
              color: #1f2937;
              line-height: 1.1;
              letter-spacing: 0.3px;
              display: block;
              white-space: normal;
              margin: 0;
              padding: 0;
            }

            .qr-text span {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.2;
              letter-spacing: 0.2px;
              display: block;
              white-space: normal;
              margin: 0;
              padding: 0;
            }

            /* DAYS CONTAINER */
            .days-container {
              display: flex;
              flex-direction: column;
              gap: 28px;
            }

            /* DAY SECTION */
            .day-section {
              border: 2px solid #9ca3af;
              border-radius: 15px;
              padding: 28px;
              page-break-inside: avoid;
              background: white;
            }

            .day-title {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 24px;
              font-weight: 400;
              color: #1f2937;
              margin: 0 0 24px 0;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            /* EVENT ITEMS - 4 Zonen */
            .event-item {
              display: flex;
              gap: 14px;
              margin-bottom: 20px;
              align-items: stretch;
            }

            .event-item:last-child {
              margin-bottom: 0;
            }

            /* Zone 1: Thumbnail */
            .event-thumb {
              flex-shrink: 0;
              width: 80px;
              height: 60px;
              border-radius: 12px;
              overflow: hidden;
              background: #e5e7eb;
            }

            .event-thumb img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }

            /* Zone 2: Zeit */
            .event-time {
              flex-shrink: 0;
              width: 50px;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              padding-right: 8px;
            }

            .event-time div {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 14px;
              font-weight: 400;
              color: #1f2937;
              line-height: 1;
              letter-spacing: 0.3px;
            }

            /* Zone 3: Trennlinie */
            .event-separator {
              width: 2.5px;
              background: #d1d5db;
              flex-shrink: 0;
              margin: 0 10px;
            }

            /* Zone 4: Textblock */
            .event-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .event-title-line {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 18px;
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 6px;
              line-height: 1.3;
              letter-spacing: 0.3px;
            }

            .event-description {
              font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
              font-size: 13px;
              color: #6b7280;
              margin-bottom: 3px;
              line-height: 1.4;
              letter-spacing: 0.2px;
            }

            .event-duration {
              font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
              font-size: 12px;
              color: #9ca3af;
              line-height: 1.3;
              letter-spacing: 0.1px;
            }

            /* FOOTER */
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 10px;
            }

            /* Hide subtext in screen version, show only in print */
            .logo-subtext {
              display: none;
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
                background: white;
                line-height: 1.6;
              }

              .container {
                width: 212.5mm;
                margin: 0 auto;
                padding: 6mm;
                max-width: 100%;
                background: white;
                box-shadow: none;
                border-radius: 0;
                box-sizing: border-box;
              }

              /* HEADER */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10mm;
                gap: 10mm;
              }

              .logo-text {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 20pt;
                font-weight: 400;
                color: #1f2937;
                margin: 0 0 0.5mm 0;
                letter-spacing: 2pt;
                flex: 1;
              }

              .logo-subtext {
                display: block;
                font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
                font-size: 9pt;
                color: #aaa;
                letter-spacing: 0.3pt;
              }

              /* QR Container - Exact sizing for print */
              .qr-container {
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                gap: 5mm;
                flex-shrink: 0;
                width: auto;
                height: auto;
              }

              .qr-code {
                width: 25mm;
                height: 25mm;
                border: none;
                display: block;
                flex-shrink: 0;
              }

              .qr-text {
                text-align: left;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 25mm;
                gap: 0;
              }

              .qr-text strong {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 11pt;
                font-weight: 400;
                color: #1f2937;
                line-height: 1.2;
                letter-spacing: 0.2pt;
                display: block;
                margin: 0;
                padding: 0;
              }

              .qr-text span {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 10pt;
                color: #6b7280;
                line-height: 1.3;
                letter-spacing: 0.1pt;
                display: block;
                margin: 0;
                padding: 0;
              }

              /* DAYS CONTAINER */
              .days-container {
                display: flex;
                flex-direction: column;
                gap: 10mm;
              }

              /* DAY SECTION - Super schmal Padding für 25% mehr Platz */
              .day-section {
                width: 100%;
                border: 1pt solid #d1d5db;
                border-radius: 6pt;
                padding: 6mm;
                margin: 0 0 8mm 0;
                page-break-inside: avoid;
                background: white;
                box-sizing: border-box;
              }

              .day-title {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 14pt;
                font-weight: 400;
                color: #1f2937;
                margin: 0 0 5mm 0;
                letter-spacing: 1pt;
                text-transform: uppercase;
              }

              /* EVENT ITEMS - LAYOUT: Zeit-LINKS | Bild | TEXT-dominant */
              .event-item {
                display: flex;
                gap: 4mm;
                margin-bottom: 5mm;
                align-items: flex-start;
              }

              .event-item:last-child {
                margin-bottom: 0;
              }

              /* Spalte 1: Zeit - HIDDEN (wird oben in Text angezeigt) */
              .event-time {
                display: none !important;
              }

              .event-time div {
                display: none !important;
              }

              /* Zeit über Titel im Print */
              .event-time-header {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 8pt;
                font-weight: 600;
                color: #999;
                line-height: 1;
                letter-spacing: 0pt;
                margin-bottom: 1mm;
              }

              /* Spalte 2: Thumbnail - NEBEN Zeit (links vom Text), klein */
              .event-thumb {
                flex-shrink: 0;
                width: 25mm;
                height: 18.75mm;
                border-radius: 3pt;
                overflow: hidden;
                background: #e5e7eb;
              }

              .event-thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
              }

              /* Spalte 3: Trennlinie - Minimal */
              .event-separator {
                display: none;
              }

              /* Spalte 4: Textblock - DOMINANT, das Hauptelement */
              .event-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
              }

              .event-title-line {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 9.5pt;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 1mm;
                line-height: 1.2;
                letter-spacing: 0.2pt;
              }

              .event-description {
                font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
                font-size: 8.5pt;
                color: #555;
                margin-bottom: 1mm;
                line-height: 1.4;
                letter-spacing: 0.1pt;
              }

              .event-duration {
                font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
                font-size: 8pt;
                color: #9ca3af;
                line-height: 1.3;
                letter-spacing: 0pt;
              }

              /* FOOTER - HIDDEN */
              .footer {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header with Logo and QR -->
            <div class="header">
              <div>
                <h1 class="logo-text">EventBuzzer</h1>
                <div class="logo-subtext">Geplant mit eventbuzzer.com</div>
              </div>
              <div class="qr-container">
                <img src="${qrCodeUrl}" alt="Route QR Code" class="qr-code">
                <div class="qr-text">
                  <strong>Mit Handy scannen<br>für Google Maps</strong>
                  <span>Öffne die komplette Route<br>mit allen Zwischenstationen</span>
                </div>
              </div>
            </div>

            <!-- Days Container - all stacked vertically -->
            <div class="days-container">
              ${daysHTML}
            </div>

            <!-- Footer -->
            <div class="footer">
              Erstellt mit EventBuzzer Trip Planner • www.eventbuzzer.ch
            </div>
          </div>
        </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '', 'width=1400,height=900');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for images to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 1000);

      toast.success('PDF-Vorschau geöffnet. Speichern unter "Drucken" → "Als PDF speichern"');
    } else {
      toast.error('Popup-Fenster konnte nicht geöffnet werden');
    }
  }, [plannedEventsByDay, generateGoogleMapsUrl, totalDays]);

  // Calculate visible event slots based on current day's planned events
  // Minimum 3 event slots, grows with additional events
  const plannedEventsCount = useMemo(
    () => currentDayEvents.filter(e => e && e.event).length,
    [currentDayEvents]
  );

  const neededEventSlots = Math.max(3, plannedEventsCount + 1);

  const visibleEventSlots = useMemo(
    () => TIME_POINTS.slice(0, neededEventSlots),
    [neededEventSlots]
  );

  // Create slot mapping for current day's events
  const slotMap = useMemo(() => {
    const map: Record<string, Event | null> = {};
    TIME_POINTS.forEach((_, index) => {
      const plannedEvent = currentDayEvents[index];
      map[`time-${index}`] = plannedEvent ? plannedEvent.event : null;
    });
    return map;
  }, [currentDayEvents]);

  // Memoize day button array to prevent re-renders
  const dayButtonArray = useMemo(
    () => Array.from({ length: totalDays || 2 }),
    [totalDays]
  );

  const tripPlannerContent = (
    <div className="flex flex-col">
        {/* Top Filter Pills */}
        <div className="mb-8 flex gap-3 flex-wrap">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setSelectedFilters((prev) => ({
                  ...prev,
                  [option.id]: prev[option.id] ? null : option.id,
                }));
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFilters[option.id]
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Timeline Section */}
        <div className="pr-4 mb-6">
          {/* AI Suggestion Button */}
          <button
            onClick={() => {
              alert('KI-Vorschläge laden (Feature noch nicht implementiert)');
            }}
            className="w-full mb-8 py-3 px-4 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            KI-Vorschläge laden
          </button>

          {/* Timeline with Time Points */}
          <div className="relative">
            {/* Continuous Timeline Line - centered at dot position */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300" style={{ left: 'calc(3rem + 0.75rem + 6px)' }} />

            {/* Timeline Items - Only event slots, no spacers */}
            {visibleEventSlots.map((timePoint, eventIndex) => {
              const plannedEvent = currentDayEvents[eventIndex];

              return (
                <EventSlot
                  key={`slot-${eventIndex}`}
                  timePoint={timePoint}
                  slotId={`time-${eventIndex}`}
                  event={plannedEvent?.event || null}
                  duration={plannedEvent?.duration}
                  onRemove={() => handleRemoveEvent(eventIndex)}
                  onSelectEvent={(slotId, selectedEvent) => {
                    const museumKeywords = ['museum', 'galerie', 'gallery', 'kunstmuseum', 'art museum'];
                    const isMuseum = museumKeywords.some(keyword => selectedEvent.title.toLowerCase().includes(keyword));
                    const duration = isMuseum ? 150 : 120;

                    const updated = {
                      ...plannedEventsByDay,
                      [activeDay]: [
                        ...(plannedEventsByDay[activeDay] || []).slice(0, eventIndex),
                        {
                          eventId: selectedEvent.id,
                          event: selectedEvent,
                          duration: duration
                        },
                        ...(plannedEventsByDay[activeDay] || []).slice(eventIndex + 1)
                      ]
                    };
                    setPlannedEventsByDay(updated);
                  }}
                  onMoveUp={() => handleMoveEventUp(eventIndex)}
                  onMoveDown={() => handleMoveEventDown(eventIndex)}
                  canMoveUp={eventIndex > 0}
                  canMoveDown={eventIndex < currentDayEvents.length - 1}
                  allEvents={allEvents}
                  slotIndex={eventIndex}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onEventClick={(event) => setSelectedEventForModal(event)}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Buttons - Grid Layout */}
        <div className="pt-6 border-t border-gray-200 space-y-2">
          {/* Row 1: Trip speichern + Google Maps */}
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2 text-sm font-medium text-white
                         bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentDayEvents.every((e) => !e)}
            >
              Trip speichern
            </button>
            <button
              className="flex-1 px-4 py-2 text-sm font-medium text-white
                         bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              disabled={currentDayEvents.every((e) => !e)}
              onClick={handleExportToGoogleMaps}
              title="Route mit Wegpunkten zu Google Maps öffnen"
            >
              <MapPin size={16} />
              <span>Google Maps</span>
            </button>
          </div>

          {/* Row 2: QR-Code + PDF Export */}
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2 text-sm font-medium text-white
                         bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              disabled={currentDayEvents.every((e) => !e)}
              onClick={handleShowQRCode}
              title="QR-Code zum Scannen mit dem Handy"
            >
              <QrCode size={16} />
              <span>QR-Code</span>
            </button>
            <button
              className="flex-1 px-4 py-2 text-sm font-medium text-white
                         bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentDayEvents.every((e) => !e)}
              onClick={handleExportPDF}
              title="Trip als PDF mit QR-Code exportieren"
            >
              Als PDF exportieren
            </button>
          </div>
        </div>
      </div>
  );

  // If flipped (used as flip-back side), render content directly
  if (isFlipped) {
    return (
      <>
        <div className="w-full h-full bg-white flex flex-col p-4 rounded-lg">
          <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Deine Reise planen</h2>

            {/* Tag Links */}
            <div className="flex items-center gap-3">
              {/* Dynamic Tags with remove button */}
              {dayButtonArray.map((_, index) => {
                const dayNumber = index + 1;
                const canRemove = totalDays && totalDays > 2 && dayNumber > 2;
                return (
                  <div key={`tag-${dayNumber}`} className="relative group">
                    <button
                      onClick={() => setActiveDay?.(dayNumber)}
                      className={cn(
                        "text-xs font-medium transition-all",
                        activeDay === dayNumber
                          ? "text-gray-900"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Tag {dayNumber}
                    </button>
                    {canRemove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setTotalDays) {
                            const newTotal = totalDays - 1;
                            setTotalDays(newTotal);
                            if (activeDay === dayNumber) {
                              setActiveDay?.(Math.min(activeDay, newTotal));
                            } else if (activeDay > dayNumber) {
                              setActiveDay?.(activeDay - 1);
                            }
                          }
                        }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Tag entfernen"
                      >
                        <X size={8} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* + Button - max 4 days with tooltip */}
              {totalDays && totalDays < 4 && (
                <div className="relative group">
                  <button
                    onClick={() => setTotalDays?.(Math.min((totalDays || 2) + 1, 4))}
                    className="text-gray-500 hover:text-gray-700 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Tag hinzufügen
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              title="Zurück zur Karte"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {tripPlannerContent}
          </div>
        </div>
        <EventDetailModal
          event={selectedEventForModal}
          isOpen={!!selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
          plannedEventsByDay={plannedEventsByDay}
          activeDay={activeDay}
          onToggleTrip={(event, day = activeDay) => {
            const allEventsFlat = Object.values(plannedEventsByDay).flat();
            const isInTrip = allEventsFlat.some(pe => pe.eventId === event.id);
            if (isInTrip) {
              const updated = { ...plannedEventsByDay };
              updated[day] = (updated[day] || []).filter(pe => pe.eventId !== event.id);
              setPlannedEventsByDay(updated);
            } else {
              const museumKeywords = ['museum', 'galerie', 'gallery', 'kunstmuseum', 'art museum'];
              const isMuseum = museumKeywords.some(keyword => event.title.toLowerCase().includes(keyword));
              const defaultDuration = isMuseum ? 150 : 120;
              const updated = {
                ...plannedEventsByDay,
                [day]: [...(plannedEventsByDay[day] || []), {
                  eventId: event.id,
                  event: event,
                  duration: defaultDuration
                }]
              };
              setPlannedEventsByDay(updated);
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }

        .flip-container {
          perspective: 1000px;
          width: 100%;
        }

        .flip-inner {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto;
          width: 100%;
          transition: transform 0.6s ease-in-out;
          transform-style: preserve-3d;
          min-height: 600px;
        }

        .flip-inner.flipped {
          transform: rotateY(180deg);
        }

        .flip-front, .flip-back {
          grid-column: 1;
          grid-row: 1;
          width: 100%;
          backface-visibility: hidden;
        }

        .flip-back {
          transform: rotateY(180deg);
        }
      `}</style>

      <div className="flip-container">
        <div className={cn("flip-inner", isFlippedLocal && "flipped")}>
          {/* Front Side - Trip Planner */}
          <div className="flip-front">
            <div className="w-full h-auto bg-white flex flex-col p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-bold">Deine Reise planen</h2>

                {/* Spacer - links */}
                <div className="flex-1" />

                {/* Tag Links + Plus - kompakt in der Mitte */}
                <div className="flex items-center gap-3">
                  {/* Dynamic Tags with remove button */}
                  {dayButtonArray.map((_, index) => {
                    const dayNumber = index + 1;
                    const canRemove = totalDays && totalDays > 2 && dayNumber > 2;
                    return (
                      <div key={`tag-wrapper-${dayNumber}`} className="relative group">
                        <button
                          onClick={() => setActiveDay?.(dayNumber)}
                          className={cn(
                            "px-2 py-1 rounded text-sm font-semibold transition-all",
                            activeDay === dayNumber
                              ? "text-gray-900 bg-gray-100"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          Tag {dayNumber}
                        </button>
                        {canRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (setTotalDays) {
                                // Remove this day and shift active day if needed
                                const newTotal = totalDays - 1;
                                setTotalDays(newTotal);
                                if (activeDay === dayNumber) {
                                  setActiveDay?.(Math.min(activeDay, newTotal));
                                } else if (activeDay > dayNumber) {
                                  setActiveDay?.(activeDay - 1);
                                }
                              }
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Tag entfernen"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* + Button - max 4 days with tooltip */}
                  {totalDays && totalDays < 4 && (
                    <div className="relative group">
                      <button
                        onClick={() => setTotalDays?.(Math.min((totalDays || 2) + 1, 4))}
                        className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Tag hinzufügen
                      </div>
                    </div>
                  )}
                </div>

                {/* Spacer - rechts */}
                <div className="flex-1" />

                {/* Favoriten Button - Right side */}
                <button
                  onClick={() => setIsFlippedLocal(true)}
                  className="px-3 py-1 rounded text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all"
                  title="Favoriten anzeigen"
                >
                  Favoriten
                </button>
              </div>
              <div className="overflow-y-auto">
                {tripPlannerContent}
              </div>
            </div>
          </div>

          {/* Back Side - Favorites */}
          <div className="flip-back">
            <FavoritesBackSide
              onFlipBack={() => setIsFlippedLocal(false)}
              favorites={favorites}
              onEventClick={(event) => setSelectedEventForModal(event)}
              onAddToTrip={handleAddFavoriteToTrip}
              plannedEventsByDay={plannedEventsByDay}
            />
          </div>
        </div>
      </div>

      <EventDetailModal
        event={selectedEventForModal}
        isOpen={!!selectedEventForModal}
        onClose={() => setSelectedEventForModal(null)}
        plannedEventsByDay={plannedEventsByDay}
        activeDay={activeDay}
        onToggleTrip={(event, day = activeDay) => {
          const allEventsFlat = Object.values(plannedEventsByDay).flat();
          const isInTrip = allEventsFlat.some(pe => pe.eventId === event.id);
          if (isInTrip) {
            const updated = { ...plannedEventsByDay };
            updated[day] = (updated[day] || []).filter(pe => pe.eventId !== event.id);
            setPlannedEventsByDay(updated);
          } else {
            const museumKeywords = ['museum', 'galerie', 'gallery', 'kunstmuseum', 'art museum'];
            const isMuseum = museumKeywords.some(keyword => event.title.toLowerCase().includes(keyword));
            const defaultDuration = isMuseum ? 150 : 120;
            const updated = {
              ...plannedEventsByDay,
              [day]: [...(plannedEventsByDay[day] || []), {
                eventId: event.id,
                event: event,
                duration: defaultDuration
              }]
            };
            setPlannedEventsByDay(updated);
          }
        }}
      />

      {/* QR Code Modal */}
      {qrCodeUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowQRCode(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Route zu Google Maps</h2>
              <button
                onClick={() => setShowQRCode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6 bg-gray-50 p-6 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}`}
                alt="Route QR Code"
                className="w-full max-w-xs"
              />
            </div>

            {/* Instructions */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Scanne diesen QR-Code mit deinem Handy um die Route in Google Maps zu öffnen
              </p>
              <p className="text-xs text-gray-400">
                Die Route wird mit allen Zwischenstationen geöffnet
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRCode(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700
                           bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Schließen
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeUrl);
                  toast.success('Link kopiert!');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white
                           bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
              >
                Link kopieren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(TripPlannerModal);
