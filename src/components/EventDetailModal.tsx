import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Heart, CalendarPlus, Share2, Copy, Mail, Star, ChevronRight, Calendar, MapPin, DollarSign, Briefcase, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFavorites } from '@/contexts/FavoritesContext';
import { toast } from 'sonner';
import { getNearestPlace } from '@/utils/swissPlaces';
import { generateEventSlug, getEventLocation } from '@/utils/eventUtilities';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface EventDetailModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'default' | 'solid'; // default = 75% transparent, solid = 85% less transparent
  // Trip Planner integration - new day-based structure
  plannedEventsByDay?: Record<number, Array<{
    eventId: string;
    event: any;
    duration: number;
  }>>;
  activeDay?: number;
  onToggleTrip?: (event: any, day?: number) => void;
}

// Format tag names for display
const formatTagName = (tag: string): string => {
  const tagMap: Record<string, string> = {
    'familie-freundlich': 'Familie',
    'must-see': 'Must-See',
    'mistwetter': 'Mistwetter',
    'ganzjährig': 'Ganzjährig',
    'wellness': 'Wellness',
    'natur': 'Natur',
    'kunst': 'Kunst',
    'kultur': 'Kultur',
    // Add more mappings as needed
  };

  return tagMap[tag] || tag;
};

// Helper to get/set user ratings from localStorage
const getUserRating = (eventId: string): number | null => {
  const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
  return ratings[eventId] || null;
};

const setUserRating = (eventId: string, rating: number) => {
  const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
  ratings[eventId] = rating;
  localStorage.setItem('eventRatings', JSON.stringify(ratings));
};

// Country names to filter out from location display
const COUNTRY_NAMES = [
  "schweiz", "switzerland", "suisse", "svizzera",
  "germany", "deutschland", "france", "frankreich",
  "austria", "österreich", "italy", "italien", "liechtenstein",
];

const isCountryName = (str?: string) => {
  if (!str) return true;
  return COUNTRY_NAMES.includes(str.toLowerCase().trim());
};


// Get full address with all details (street + city + country ALWAYS)
const getFullAddress = (event: any): string => {
  const addressParts: string[] = [];

  // Add street if available
  if (event.address_street?.trim()) {
    addressParts.push(event.address_street.trim());
  }

  // Add postal code + city if available
  if (event.address_zip?.trim() && event.address_city?.trim()) {
    addressParts.push(`${event.address_zip.trim()} ${event.address_city.trim()}`);
  } else if (event.address_city?.trim()) {
    addressParts.push(event.address_city.trim());
  }

  // If no address yet, use getEventLocation (city from venue/location/lat-lng)
  if (addressParts.length === 0) {
    const location = getEventLocation(event);
    // Only add if it's not just "Schweiz"
    if (location && location !== "Schweiz") {
      addressParts.push(location);
    }
  }

  // Determine if we should add Schweiz
  const lastCity = event.address_city || getEventLocation(event);
  const shouldAddSchweiz = lastCity && lastCity !== "Schweiz" && !isCountryName(lastCity);

  if (shouldAddSchweiz) {
    addressParts.push("Schweiz");
  }

  // Return address, filtering out empty strings
  const fullAddress = addressParts.filter(Boolean).join(", ");

  // Always return something meaningful - never just "Schweiz"
  return fullAddress && fullAddress !== "Schweiz" ? fullAddress : "";
};

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  variant = 'default',
  plannedEventsByDay = {},
  activeDay = 1,
  onToggleTrip
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isMobile = useIsMobile();
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showTagsPopup, setShowTagsPopup] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRatingState] = useState<number | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const [touchStart, setTouchStart] = useState(0);

  // Reset position, description, and rating state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      setShowFullDescription(false);
      // Reset rating state - will be loaded by event?.id useEffect
      setUserRatingState(null);
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === 0) return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;

    // Swipe up more than 50px to close
    if (diff > 50) {
      onClose();
    }

    setTouchStart(0);
  };

  // Load user's existing rating for this event
  useEffect(() => {
    if (event?.id && isOpen) {
      setUserRatingState(getUserRating(event.id));
    }
  }, [event?.id, isOpen]);

  if (!event) return null;

  const isFavorited = isFavorite(event.id);
  const isInTrip = Object.values(plannedEventsByDay || {})
    .flat()
    .some(pe => pe.eventId === event.id);

  // Generate SEO-friendly slug for URLs - MUST match sitemap generation exactly!
  // Sitemap uses: address_city || location (NO smart filtering!)
  const seoSlug = generateEventSlug(event.title, event.address_city || event.location || '');

  // Calculate display score with user rating boost
  const baseScore = (event.buzz_score || event.relevance_score || 75) / 20;
  const ratingBoost = userRating ? (userRating - 3) * 0.1 : 0;
  const displayScore = Math.min(5, Math.max(0, baseScore + ratingBoost)).toFixed(1);

  // Handle rating submission
  const handleRating = (rating: number) => {
    setUserRating(event.id, rating);
    setUserRatingState(rating);
    setShowRatingPopup(false);
    toast.success(`Danke für deine Bewertung! ⭐ ${rating}/5`, { duration: 2000, position: "top-center" });
  };

  // Calendar export function
  const exportToCalendar = () => {
    const formatDateForICS = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = event.start_date ? formatDateForICS(event.start_date) : '';
    const endDate = event.end_date ? formatDateForICS(event.end_date) : '';
    const location = event.venue_name || event.address_city || event.location || "Schweiz";
    const description = (event.short_description || event.description || "").replace(/\n/g, '\\n');
    const eventUrl = `${window.location.origin}/event/${seoSlug}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventBuzzer//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@eventbuzzer.ch`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${description}\\n\\nMehr Infos: ${eventUrl}`,
      `LOCATION:${location}`,
      `URL:${eventUrl}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Event zum Kalender hinzugefügt!", { position: "top-center" });
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    const eventUrl = `${window.location.origin}/event/${seoSlug}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success("Link kopiert!", {
        description: "Der Event-Link wurde in die Zwischenablage kopiert.",
        position: "top-center"
      });
      setShowSharePopup(false);
    } catch {
      toast.error("Fehler", {
        description: "Link konnte nicht kopiert werden.",
        position: "top-center"
      });
    }
  };

  // WhatsApp share
  const shareViaWhatsApp = () => {
    const eventUrl = `${window.location.origin}/event/${seoSlug}`;
    const text = `Check out this event: ${event.title} ${eventUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Email share
  const shareViaEmail = () => {
    const eventUrl = `${window.location.origin}/event/${seoSlug}`;
    const subject = `Event: ${event.title}`;
    const body = `Hallo,\n\nIch habe diesen Event gefunden:\n${event.title}\n\n${eventUrl}\n\nLiebe Grüsse`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleToggleFavorite = () => {
    const wasFavorite = isFavorited;

    toggleFavorite({
      id: event.id,
      slug: event.id,
      title: event.title,
      venue: event.venue_name || "",
      image: event.image_url || "",
      location: event.address_city || event.location || "",
      date: event.start_date ? new Date(event.start_date).toLocaleDateString('de-CH') : "",
      // Extended fields for richer favorites display
      short_description: event.short_description || "",
      description: event.description || "",
      tags: event.tags || [],
      image_url: event.image_url || "",
      venue_name: event.venue_name || "",
      address_city: event.address_city || "",
      start_date: event.start_date || "",
      end_date: event.end_date || "",
      price_from: event.price_from,
      external_id: event.external_id || event.id,
      ticket_url: event.ticket_url || "",
      url: event.url || "",
      buzz_score: event.buzz_score || event.relevance_score,
    });

    // ONLY show toast when ADDING to favorites (not when removing)
    if (!wasFavorite) {
      toast.success("Event geplant ✨", { duration: 2000, position: "top-left" });
    }
  };

  // Mobile: Use Drawer from top, Desktop: Use Dialog in center
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose} direction="top" modal={false}>
        {/* Click outside to close - allows map panning while popup is open */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[55] md:hidden"
            style={{ pointerEvents: 'none' }}
          />
        )}
        <DrawerContent
          className="fixed inset-x-0 top-0 z-[60] mt-0 flex h-auto max-h-[70vh] flex-col rounded-b-[16px] border bg-white"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle - Top Bar with Close Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200/80 hover:bg-gray-300 transition-colors"
              title="Schließen"
            >
              <X size={16} className="text-gray-700" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-4 pb-4">
            {/* Hero Image - NO text on it */}
            {event.image_url && (
              <div className="relative w-full h-[150px] overflow-hidden rounded-xl mt-3 mb-3">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />

                {/* Tags Pills - oben links, max 2 mobile + 3 desktop + Rest als klickbares "+X" */}
                {event.tags && event.tags.length > 0 && (
                  <div className="absolute top-3 left-3 z-10 flex gap-1.5 flex-wrap max-w-[90%]">
                    {event.tags.slice(0, 2).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-white/70 backdrop-blur-md text-gray-800 text-[8px] font-bold px-2 py-1 rounded whitespace-nowrap"
                      >
                        {formatTagName(tag)}
                      </span>
                    ))}
                    {event.tags.length > 2 && (
                      <Popover open={showTagsPopup} onOpenChange={setShowTagsPopup}>
                        <PopoverTrigger asChild>
                          <button className="bg-white/70 backdrop-blur-md text-gray-800 text-[8px] font-bold px-2 py-1 rounded hover:bg-white/90 transition-colors cursor-pointer">
                            +{event.tags.length - 2}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3" align="start">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Alle Tags:</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {event.tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-1 rounded text-center"
                              >
                                {formatTagName(tag)}
                              </span>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {/* Title */}
              <DrawerHeader className="p-0">
                <DrawerTitle className="text-lg font-serif text-gray-900" style={{ fontFamily: 'Garamond, "New York", Georgia, serif' }}>{event.title}</DrawerTitle>
              </DrawerHeader>

              {/* Description - compact on mobile */}
              {event.short_description && (
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                  {event.short_description}
                </p>
              )}

              {/* Compact Details */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {event.external_id?.startsWith('tm_') && event.start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-gray-600" />
                    <span>
                      {new Date(event.start_date).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}

                {(() => {
                  let displayLocation = getFullAddress(event);
                  if (!displayLocation) {
                    displayLocation = getEventLocation(event);
                  }
                  return displayLocation && displayLocation !== "Schweiz" && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-gray-600" />
                      <span>{displayLocation}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons - Compact on mobile */}
              <div className="flex gap-2 mt-3">
                {/* Rating */}
                <Popover open={showRatingPopup} onOpenChange={setShowRatingPopup}>
                  <PopoverTrigger asChild>
                    <button
                      className={`flex-1 flex items-center justify-center gap-1 px-2 h-10 rounded-full border text-xs font-semibold ${userRating ? 'border-[#fbbf24] border-2 text-[#fbbf24]' : 'border-gray-300 text-gray-500'} hover:scale-105 transition-all`}
                      title={userRating ? `Deine Bewertung: ${userRating}/5` : "Event bewerten"}
                    >
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span>{displayScore}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="center">
                    <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
                      {userRating ? 'Deine Bewertung ändern:' : 'Event bewerten:'}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={20}
                            className={
                              (hoverRating || userRating || 0) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Favorite */}
                <button
                  onClick={handleToggleFavorite}
                  className="flex-1 flex items-center justify-center h-10 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 transition-all"
                  title={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                >
                  <Heart
                    size={16}
                    className={isFavorited ? "fill-current text-red-500" : ""}
                  />
                </button>

                {/* Share */}
                <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
                  <PopoverTrigger asChild>
                    <button
                      className="flex-1 flex items-center justify-center h-10 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 transition-all"
                      title="Event teilen"
                    >
                      <Share2 size={16} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                      <button
                        onClick={copyToClipboard}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <Copy size={16} className="text-gray-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">Link kopieren</span>
                      </button>
                      <button
                        onClick={shareViaWhatsApp}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                      </button>
                      <button
                        onClick={shareViaEmail}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <Mail size={16} className="text-gray-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">E-Mail</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Briefcase - Trip Planner */}
                <button
                  onClick={() => {
                    if (onToggleTrip) {
                      onToggleTrip(event, activeDay);
                    }
                  }}
                  className="flex-1 flex items-center justify-center h-10 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 transition-all"
                  title={isInTrip ? "Aus Reiseplanung entfernen" : "Zur Reiseplanung hinzufügen"}
                >
                  <Briefcase
                    size={16}
                    className={isInTrip ? "text-red-500" : ""}
                  />
                </button>
              </div>

              {/* Ticket Button */}
              <button
                onClick={() => {
                  if (event.ticket_url || event.url) {
                    window.open(event.ticket_url || event.url, '_blank');
                  } else {
                    toast.info("Ticket-Verkauf demnächst verfügbar", { position: "top-center" });
                  }
                }}
                className="w-full py-2 mt-3 rounded-full bg-indigo-900 hover:bg-indigo-950 transition-colors shadow-lg"
              >
                <span className="text-xs font-semibold text-white">Ticket kaufen</span>
              </button>

              {/* Detail Page Link */}
              <Link
                to={`/event/${seoSlug}`}
                className="flex items-center justify-center gap-1 py-2 text-indigo-900 hover:text-indigo-950 font-medium text-sm transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <span>Mehr Details</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Original Dialog behavior
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
          className="max-w-xl max-h-[90vh] overflow-y-auto p-[8px] md:p-[10px] border border-white/30 shadow-2xl rounded-2xl"
          style={{
            background: variant === 'solid' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'fixed',
            top: `calc(160px + ${position.y}px)`,
            left: `calc(50% + ${position.x}px)`,
            transform: 'translateX(-50%)',
            fontSize: '0.95em'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
        {/* Drag Handle - Top Bar with Close Button */}
        <div
          className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-3"
        >
          <div className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown}>
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200/80 hover:bg-gray-300 transition-colors"
            title="Schließen"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Hero Image - NO text on it */}
        {event.image_url && (
          <div className="relative w-full h-[200px] md:h-[280px] overflow-hidden rounded-xl">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />

            {/* Tags Pills - oben links, max 2 mobile + 3 desktop + Rest als klickbares "+X" */}
            {event.tags && event.tags.length > 0 && (
              <div className="absolute top-3 left-3 z-10 flex gap-1.5 md:gap-2 flex-wrap max-w-[90%]">
                {event.tags.slice(0, 2).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-white/70 backdrop-blur-md text-gray-800 text-[8px] md:text-[10px] font-bold md:tracking-wider uppercase px-2 md:px-3 py-1 md:py-1.5 rounded whitespace-nowrap"
                  >
                    {formatTagName(tag)}
                  </span>
                ))}
                {event.tags.length > 2 && (
                  <Popover open={showTagsPopup} onOpenChange={setShowTagsPopup}>
                    <PopoverTrigger asChild>
                      <button className="bg-white/70 backdrop-blur-md text-gray-800 text-[8px] md:text-[10px] font-bold px-2 md:px-3 py-1 md:py-1.5 rounded hover:bg-white/90 transition-colors cursor-pointer">
                        +{event.tags.length - 2}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-3" align="start">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Alle Tags:</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {event.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-1 rounded text-center"
                          >
                            {formatTagName(tag)}
                          </span>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 md:space-y-3 mt-3 md:mt-4 pr-2 md:pr-3">
          {/* Title UNDER the image */}
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-serif text-gray-900" style={{ fontFamily: 'Garamond, "New York", Georgia, serif' }}>{event.title}</DialogTitle>
          </DialogHeader>

          {/* Description UNDER the title - expandable */}
          {(event.description || event.short_description) && (() => {
            const fullText = event.description || event.short_description || '';
            const showMehrLesen = fullText.length > 140;

            return (
              <div className="text-sm text-gray-700 leading-relaxed">
                <p
                  className="text-justify"
                  lang="de"
                  style={{
                    hyphens: 'auto',
                    WebkitHyphens: 'auto',
                    ...(showFullDescription ? {} : {
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    })
                  }}
                >
                  {fullText}
                </p>
                {showMehrLesen && (
                  <div className="mt-1">
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-indigo-900 hover:text-indigo-950 underline underline-offset-2 font-semibold whitespace-nowrap opacity-80"
                    >
                      {showFullDescription ? 'weniger' : 'mehr lesen'}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-between pt-4 md:pt-6 gap-3 md:gap-0">
            <div className="flex items-center gap-2 md:gap-5 w-full md:w-auto justify-between md:justify-start">
              {/* Rating - Klickbar für User-Bewertung */}
              <Popover open={showRatingPopup} onOpenChange={setShowRatingPopup}>
                <PopoverTrigger asChild>
                  <button
                    className={`flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 h-12 md:h-11 rounded-full border ${userRating ? 'border-[#fbbf24] border-2' : 'border-gray-300'} text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:scale-105 transition-all shadow-md group flex-1 md:flex-initial`}
                    title={userRating ? `Deine Bewertung: ${userRating}/5` : "Event bewerten"}
                  >
                    <Star size={18} className="fill-yellow-400 text-yellow-400 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm font-semibold text-[#fbbf24]">{displayScore}</span>
                    {userRating && <Check size={12} className="text-green-500 md:w-3.5 md:h-3.5" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="center">
                  <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
                    {userRating ? 'Deine Bewertung ändern:' : 'Event bewerten:'}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
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

              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                className="flex items-center justify-center flex-1 md:flex-initial md:w-11 h-12 md:h-11 rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:scale-105 transition-all shadow-md focus:outline-none"
                title={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
              >
                <Heart
                  size={18}
                  className={cn("md:w-5 md:h-5", isFavorited ? "fill-current text-red-500" : "")}
                />
              </button>

              {/* Share Button */}
              <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center justify-center flex-1 md:flex-initial md:w-11 h-12 md:h-11 rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:scale-105 transition-all shadow-md"
                    title="Event teilen"
                  >
                    <Share2 size={18} className="md:w-5 md:h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <Copy size={18} className="text-gray-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">Link kopieren</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareViaWhatsApp();
                        setShowSharePopup(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <svg className="w-[18px] h-[18px] text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareViaEmail();
                        setShowSharePopup(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <Mail size={18} className="text-gray-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">E-Mail</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Briefcase Button - Add to Trip */}
              <button
                onClick={() => {
                  if (onToggleTrip) {
                    onToggleTrip(event, activeDay);
                  }
                }}
                className="flex items-center justify-center flex-1 md:flex-initial md:w-11 h-12 md:h-11 rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:scale-105 transition-all shadow-md"
                title={isInTrip ? "Aus Reiseplanung entfernen" : "Zur Reiseplanung hinzufügen"}
              >
                <Briefcase
                  size={18}
                  className={cn("md:w-5 md:h-5", isInTrip ? "text-red-500" : "")}
                />
              </button>
            </div>

            {/* Ticket Button - full width on mobile, right-aligned on desktop */}
            <button
              onClick={() => {
                if (event.ticket_url || event.url) {
                  window.open(event.ticket_url || event.url, '_blank');
                } else {
                  toast.info("Ticket-Verkauf demnächst verfügbar", { position: "top-center" });
                }
              }}
              className="w-full md:w-auto flex items-center justify-center px-8 md:px-14 py-2.5 rounded-full bg-indigo-900 hover:bg-indigo-950 transition-colors shadow-lg"
              title="Ticket kaufen"
            >
              <span className="text-sm font-semibold text-white">Ticket kaufen</span>
            </button>
          </div>

          {/* Compact Details - nur die wichtigsten Infos */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 pt-1 md:pt-2">
            {event.external_id?.startsWith('tm_') && event.start_date && (
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-gray-600" />
                <span>
                  {new Date(event.start_date).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}

            {(() => {
              // Try full address first, fallback to location
              let displayLocation = getFullAddress(event);

              // If no full address, use city/location
              if (!displayLocation) {
                displayLocation = getEventLocation(event);
              }

              return displayLocation && displayLocation !== "Schweiz" && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-gray-600" />
                  <span>{displayLocation}</span>
                </div>
              );
            })()}

            {event.price_from !== null && event.price_from !== undefined && (
              <div className="flex items-center gap-1.5">
                <DollarSign size={16} className="text-gray-600" />
                <span>
                  {event.price_from === 0
                    ? 'Gratis'
                    : `CHF ${event.price_from}+`
                  }
                </span>
              </div>
            )}

            {/* Detail Page Link - Chevron im Footer */}
            <Link
              to={`/event/${seoSlug}`}
              className="ml-auto -mr-2 flex items-center gap-0.5 text-indigo-900 hover:text-indigo-950 font-medium transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClose(); // Close modal before navigating
              }}
            >
              <span>Details</span>
              <ChevronRight size={16} />
            </Link>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
