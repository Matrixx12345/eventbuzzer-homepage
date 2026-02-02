import React, { useState, useCallback, useRef } from 'react';
import { X, Plus, Sparkles, Briefcase, ChevronUp, ChevronDown, Trash2, Heart, MapPin, QrCode } from 'lucide-react';
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
      {/* Header with centered title and close button */}
      <div className="flex items-center justify-center mb-6 pb-4 border-b border-gray-200 relative">
        <h2 className="text-lg font-bold text-gray-500">Favoriten</h2>
        <button
          onClick={onFlipBack}
          className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 absolute right-0"
          title="Zurück zum Trip Planner"
        >
          <X size={20} />
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
      <button
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

      </button>
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
  const currentDayEvents = plannedEventsByDay[activeDay] || [];

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

  // Handler to export trip as PDF with QR code
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

    // Generate QR code URL - kleiner (200x200)
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

    // Group events by day from plannedEventsByDay structure
    const daysCount = totalDays || 1;
    const eventsByDay: Record<number, typeof validEvents> = {};

    // Use actual day-based structure instead of artificial splitting
    for (let day = 1; day <= daysCount; day++) {
      const dayEvents = plannedEventsByDay?.[day] || [];
      eventsByDay[day] = dayEvents.filter(pe => pe && pe.event);
    }

    // Generate HTML for all days
    const eventsByDayHTML = Object.entries(eventsByDay)
      .map(([dayNum, dayEvents]) => {
        const dayNumber = parseInt(dayNum);
        const dayLabel = daysCount === 1 ? 'Tag' : `Tag ${dayNumber}`;

        const dayEventsHTML = dayEvents
          .map((pe, dayIndex) => {
            const dayEventIndex = dayIndex + 1;
            const shortDesc = pe.event.short_description || pe.event.description || '';
            const truncatedDesc = truncateAtFirstSentence(shortDesc);

            return `
        <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
          <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px;">
            <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0;">
              ${dayEventIndex}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 16px; color: #1f2937; margin-bottom: 2px;">
                ${pe.event.title}
              </div>
            </div>
          </div>
            <div style="margin-left: 42px; margin-top: 10px;">
              <div style="color: #4b5563; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
                📍 ${pe.event.address_city || pe.event.location || 'Location'}
              </div>
              ${truncatedDesc ? `<div style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
                ${truncatedDesc}
              </div>` : ''}
              <div style="color: #9ca3af; font-size: 12px;">
                ⏱️ ${pe.duration || 120} Minuten
              </div>
            </div>
          </div>
        </div>
      `;
          })
          .join('');

        return `
        <div style="margin-bottom: 32px; page-break-inside: avoid;">
          <h3 style="font-size: 20px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #667eea;">
            ${dayLabel}
          </h3>
          ${dayEventsHTML}
        </div>
      `;
      })
      .join('');

    const eventsList = eventsByDayHTML;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Trip Planner - EventBuzzer</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
              margin: 0;
              padding: 20px;
              color: #1f2937;
              background: white;
              line-height: 1.6;
            }
            .container {
              max-width: 700px;
              margin: 0 auto;
            }
            .logo {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 2px solid #667eea;
            }
            .logo-text {
              font-size: 24px;
              font-weight: 700;
              color: #667eea;
              margin: 0;
            }
            .header-info {
              text-align: center;
              margin-bottom: 28px;
            }
            .date {
              color: #6b7280;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .event-count {
              color: #1f2937;
              font-weight: 600;
              font-size: 16px;
            }
            .qr-section {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin: 32px 0;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
            }
            .qr-code {
              text-align: center;
              margin-bottom: 16px;
            }
            .qr-code img {
              width: 180px;
              height: 180px;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              display: block;
            }
            .qr-description {
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.5;
              max-width: 500px;
            }
            .qr-description strong {
              color: #1f2937;
              display: block;
              margin-bottom: 6px;
              font-size: 13px;
            }
            .events-section {
              margin-top: 32px;
            }
            .events-title {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid #667eea;
            }
            .event-item {
              margin-bottom: 24px;
              padding: 0;
              border-top: 1px solid #e5e7eb;
            }
            .event-number {
              background: #667eea;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              flex-shrink: 0;
              margin-bottom: 8px;
            }
            .event-title {
              font-weight: 600;
              font-size: 15px;
              color: #1f2937;
              margin-bottom: 4px;
            }
            .event-tag {
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 10px;
            }
            .event-location {
              color: #4b5563;
              font-size: 13px;
              line-height: 1.5;
              margin-bottom: 8px;
            }
            .event-description {
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
              margin-bottom: 8px;
            }
            .event-duration {
              color: #9ca3af;
              font-size: 12px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
            }
            @media print {
              body {
                margin: 0;
                padding: 12px;
              }
              .container {
                max-width: 100%;
              }
              .qr-section {
                page-break-inside: avoid;
              }
              .event-item {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <p class="logo-text">🎯 EventBuzzer</p>
            </div>

            <div class="header-info">
              <div class="date">${todayDate}</div>
              <div class="event-count">${validEvents.length} ${validEvents.length === 1 ? 'Event' : 'Events'}</div>
            </div>

            <div class="qr-section">
              <div class="qr-code">
                <img src="${qrCodeUrl}" alt="Route QR Code">
              </div>
              <div class="qr-description">
                <strong>Mit Handy scannen für Google Maps</strong>
                <span>Öffne die komplette Route mit allen Zwischenstationen</span>
              </div>
            </div>

            <div class="events-section">
              ${eventsList}
            </div>

            <div class="footer">
              Erstellt mit EventBuzzer Trip Planner
            </div>
          </div>
        </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '', 'width=900,height=1200');
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
  }, [plannedEventsByDay, generateGoogleMapsUrl]);

  // Calculate visible event slots based on current day's planned events
  // Minimum 3 event slots, grows with additional events
  const plannedEventsCount = currentDayEvents.filter(e => e && e.event).length;
  const minEventSlots = 3;
  const neededEventSlots = Math.max(minEventSlots, plannedEventsCount + 1);
  const visibleEventSlots = TIME_POINTS.slice(0, neededEventSlots);

  // Create slot mapping for current day's events
  const slotMap: Record<string, Event | null> = {};
  TIME_POINTS.forEach((_, index) => {
    const plannedEvent = currentDayEvents[index];
    slotMap[`time-${index}`] = plannedEvent ? plannedEvent.event : null;
  });

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
              disabled={plannedEvents.every((e) => !e)}
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
              disabled={plannedEvents.every((e) => !e)}
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
              {/* Dynamic Tags */}
              {Array.from({ length: totalDays || 2 }).map((_, index) => (
                <button
                  key={`tag-${index + 1}`}
                  onClick={() => setActiveDay?.(index + 1)}
                  className={cn(
                    "text-xs font-medium transition-all",
                    activeDay === index + 1
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Tag {index + 1}
                </button>
              ))}

              {/* + Button */}
              {totalDays && totalDays < 5 && (
                <button
                  onClick={() => setTotalDays?.(Math.min((totalDays || 2) + 1, 5))}
                  className="text-gray-500 hover:text-gray-700 transition-all"
                  title="Tag hinzufügen"
                >
                  <Plus size={14} />
                </button>
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
          plannedEvents={plannedEvents}
          onToggleTrip={(event) => {
            const isInTrip = plannedEvents.some(pe => pe.eventId === event.id);
            if (isInTrip) {
              setPlannedEvents(plannedEvents.filter(pe => pe.eventId !== event.id));
            } else {
              const museumKeywords = ['museum', 'galerie', 'gallery', 'kunstmuseum', 'art museum'];
              const isMuseum = museumKeywords.some(keyword => event.title.toLowerCase().includes(keyword));
              const defaultDuration = isMuseum ? 150 : 120;
              setPlannedEvents([...plannedEvents, {
                eventId: event.id,
                event: event,
                duration: defaultDuration
              }]);
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
                  {/* Dynamic Tags */}
                  {Array.from({ length: totalDays || 2 }).map((_, index) => (
                    <button
                      key={`tag-flipped-${index + 1}`}
                      onClick={() => setActiveDay?.(index + 1)}
                      className={cn(
                        "px-2 py-1 rounded text-sm font-semibold transition-all",
                        activeDay === index + 1
                          ? "text-gray-900 bg-gray-100"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      Tag {index + 1}
                    </button>
                  ))}

                  {/* + Button */}
                  {totalDays && totalDays < 5 && (
                    <button
                      onClick={() => setTotalDays?.(Math.min((totalDays || 2) + 1, 5))}
                      className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                      title="Tag hinzufügen"
                    >
                      <Plus size={16} />
                    </button>
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

                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                >
                  <X size={20} />
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
              plannedEvents={plannedEvents}
            />
          </div>
        </div>
      </div>

      <EventDetailModal
        event={selectedEventForModal}
        isOpen={!!selectedEventForModal}
        onClose={() => setSelectedEventForModal(null)}
        plannedEvents={plannedEvents}
        onToggleTrip={(event) => {
          const isInTrip = plannedEvents.some(pe => pe.eventId === event.id);
          if (isInTrip) {
            setPlannedEvents(plannedEvents.filter(pe => pe.eventId !== event.id));
          } else {
            const museumKeywords = ['museum', 'galerie', 'gallery', 'kunstmuseum', 'art museum'];
            const isMuseum = museumKeywords.some(keyword => event.title.toLowerCase().includes(keyword));
            const defaultDuration = isMuseum ? 150 : 120;
            setPlannedEvents([...plannedEvents, {
              eventId: event.id,
              event: event,
              duration: defaultDuration
            }]);
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

export default TripPlannerModal;
