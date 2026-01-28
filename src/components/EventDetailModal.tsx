import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, CalendarPlus, Share2, Copy, Mail, Star, ChevronRight, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFavorites } from '@/contexts/FavoritesContext';
import { toast } from 'sonner';

interface EventDetailModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
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

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, isOpen, onClose }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showTagsPopup, setShowTagsPopup] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRatingState] = useState<number | null>(null);

  // Load user's existing rating for this event
  useEffect(() => {
    if (event?.id) {
      setUserRatingState(getUserRating(event.id));
    }
  }, [event?.id]);

  if (!event) return null;

  const isFavorited = isFavorite(event.id);

  // Calculate display score with user rating boost
  const baseScore = (event.buzz_score || event.relevance_score || 75) / 20;
  const ratingBoost = userRating ? (userRating - 3) * 0.1 : 0;
  const displayScore = Math.min(5, Math.max(0, baseScore + ratingBoost)).toFixed(1);

  // Handle rating submission
  const handleRating = (rating: number) => {
    setUserRating(event.id, rating);
    setUserRatingState(rating);
    setShowRatingPopup(false);
    toast.success(`Danke für deine Bewertung! ⭐ ${rating}/5`, { duration: 2000 });
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
    const eventUrl = `${window.location.origin}/event/${event.external_id || event.id}`;

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
    toast.success("Event zum Kalender hinzugefügt!");
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    const eventUrl = `${window.location.origin}/event/${event.external_id || event.id}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success("Link kopiert!", {
        description: "Der Event-Link wurde in die Zwischenablage kopiert.",
      });
      setShowSharePopup(false);
    } catch {
      toast.error("Fehler", {
        description: "Link konnte nicht kopiert werden.",
      });
    }
  };

  // WhatsApp share
  const shareViaWhatsApp = () => {
    const eventUrl = `${window.location.origin}/event/${event.external_id || event.id}`;
    const text = `Check out this event: ${event.title} ${eventUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Email share
  const shareViaEmail = () => {
    const eventUrl = `${window.location.origin}/event/${event.external_id || event.id}`;
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
      date: event.start_date ? new Date(event.start_date).toLocaleDateString('de-CH') : ""
    });

    // ONLY show toast when ADDING to favorites (not when removing)
    if (!wasFavorite) {
      toast.success("Event geplant ✨", { duration: 2000 });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto p-[12px] border border-white/30 shadow-2xl rounded-2xl mt-[15px]"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
        {/* Hero Image - NO text on it */}
        {event.image_url && (
          <div className="relative w-full h-[280px] overflow-hidden rounded-xl">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />

            {/* Tags Pills - oben links, max 3 + Rest als klickbares "+X" */}
            {event.tags && event.tags.length > 0 && (
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {event.tags.slice(0, 3).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-white/70 backdrop-blur-md text-gray-800 text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded"
                  >
                    {formatTagName(tag)}
                  </span>
                ))}
                {event.tags.length > 3 && (
                  <Popover open={showTagsPopup} onOpenChange={setShowTagsPopup}>
                    <PopoverTrigger asChild>
                      <button className="bg-white/70 backdrop-blur-md text-gray-800 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-white/90 transition-colors cursor-pointer">
                        +{event.tags.length - 3}
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

        <div className="space-y-3 mt-4 pr-3">
          {/* Title UNDER the image */}
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-gray-900" style={{ fontFamily: 'Garamond, "New York", Georgia, serif' }}>{event.title}</DialogTitle>
          </DialogHeader>

          {/* Description UNDER the title - max 2 lines, "mehr lesen" if truncated */}
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
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {fullText}
                </p>
                {showMehrLesen && (
                  <div className="mt-1">
                    <Link
                      to={`/event/${event.external_id || event.id}`}
                      className="text-indigo-900 hover:text-indigo-950 underline underline-offset-2 font-semibold whitespace-nowrap opacity-80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      mehr lesen
                    </Link>
                  </div>
                )}
              </div>
            );
          })()}
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-7">
              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:scale-105 transition-all shadow-md focus:outline-none"
                title={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
              >
                <Heart
                  size={20}
                  className={isFavorited ? "fill-current text-red-500" : ""}
                />
              </button>

              {/* Calendar Button */}
              <button
                onClick={exportToCalendar}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:scale-105 transition-all shadow-md"
                title="Im Kalender speichern"
              >
                <CalendarPlus size={20} />
              </button>

              {/* Share Button */}
              <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:scale-105 transition-all shadow-md"
                    title="Event teilen"
                  >
                    <Share2 size={20} />
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

              {/* Rating - Klickbar für User-Bewertung */}
              <Popover open={showRatingPopup} onOpenChange={setShowRatingPopup}>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 group"
                    title="Event bewerten"
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 shadow-md group-hover:border-yellow-400 group-hover:bg-yellow-50 transition-all">
                      <Star size={20} className={userRating ? "fill-yellow-400 text-yellow-400" : "text-yellow-500"} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {displayScore}
                    </span>
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
            </div>

            {/* Ticket Button - dunkleres Blau, breiter, rechtsbündig */}
            <button
              onClick={() => {
                if (event.ticket_url || event.url) {
                  window.open(event.ticket_url || event.url, '_blank');
                } else {
                  toast.info("Ticket-Verkauf demnächst verfügbar");
                }
              }}
              className="flex items-center justify-center px-14 py-2.5 rounded-full bg-indigo-900 hover:bg-indigo-950 transition-colors shadow-lg"
              title="Ticket kaufen"
            >
              <span className="text-sm font-semibold text-white">Ticket kaufen</span>
            </button>
          </div>

          {/* Compact Details - nur die wichtigsten Infos */}
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-2">
            {(event.start_date || (event.tags && event.tags.includes('ganzjährig'))) && (
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-gray-600" />
                <span>
                  {event.tags && event.tags.includes('ganzjährig')
                    ? 'Ganzjährig'
                    : new Date(event.start_date).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
                  }
                </span>
              </div>
            )}

            {event.venue_name && (
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-gray-600" />
                <span>{event.venue_name}</span>
              </div>
            )}

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
              to={`/event/${event.external_id || event.id}`}
              className="ml-auto -mr-2 flex items-center gap-0.5 text-indigo-900 hover:text-indigo-950 font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
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
