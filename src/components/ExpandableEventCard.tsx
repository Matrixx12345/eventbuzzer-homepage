import React, { useState } from 'react';
import { Heart, CalendarPlus, Share2, ShoppingCart, MapPin, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { BuzzSlider } from './BuzzSlider';
import { ImageGallery } from './ImageGallery';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface ExpandableEventCardProps {
  event: any;
  className?: string;
}

export const ExpandableEventCard: React.FC<ExpandableEventCardProps> = ({ event, className }) => {
  const [expanded, setExpanded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showSharePopup, setShowSharePopup] = useState(false);

  const isFavorited = isFavorite(event.id);

  const toggleExpanded = () => {
    setExpanded(!expanded);
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

  const handleTicketClick = () => {
    if (event.ticket_url || event.url) {
      window.open(event.ticket_url || event.url, '_blank');
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasFavorite = isFavorited;

    toggleFavorite({
      id: event.id,
      slug: event.id,
      title: event.title,
      venue: event.venue_name || "",
      image: event.image_url || event.image || "",
      location: event.address_city || event.location || "",
      date: event.tags && event.tags.includes('ganzjährig') ? 'Ganzjährig' : (event.start_date ? new Date(event.start_date).toLocaleDateString('de-CH') : ""),
      // Extended fields for richer favorites display
      short_description: event.short_description || "",
      description: event.description || "",
      tags: event.tags || [],
      image_url: event.image_url || event.image || "",
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
      toast.success("Event geplant ✨", { duration: 2000 });
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-md transition-all duration-300 overflow-hidden",
        "hover:shadow-lg",
        expanded ? "p-6" : "p-4",
        className
      )}
    >
      {/* Header - Always visible */}
      <div className="flex gap-4 cursor-pointer" onClick={toggleExpanded}>
        {/* Event Image */}
        <div className="flex-shrink-0">
          <img
            src={event.image || event.image_url}
            alt={event.title}
            className="w-32 h-32 rounded object-cover"
          />
        </div>

        {/* Event Info - Collapsed */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-serif font-bold text-lg text-gray-900 line-clamp-2">
              {event.title}
            </h3>

            {/* Heart Icon - klein, immer sichtbar */}
            <button
              onClick={handleToggleFavorite}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Heart
                size={20}
                className={cn(
                  "transition-colors",
                  isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"
                )}
              />
            </button>
          </div>

          {/* Location */}
          {(event.venue_name || event.address_city) && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <MapPin size={14} />
              <span className="truncate">{event.venue_name || event.address_city}</span>
            </div>
          )}

          {/* Date & Rating */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            {(event.start_date || (event.tags && event.tags.includes('ganzjährig'))) && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>
                  {event.tags && event.tags.includes('ganzjährig')
                    ? 'Ganzjährig'
                    : new Date(event.start_date).toLocaleDateString('de-DE')
                  }
                </span>
              </div>
            )}
            {event.rating && (
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
                <span>{event.rating}</span>
              </div>
            )}
          </div>

          {/* Buzz Slider */}
          {event.buzz && (
            <BuzzSlider value={event.buzz} className="mt-2" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-6 space-y-4 animate-in slide-in-from-top duration-300">
          {/* Description */}
          {(event.description || event.short_description) && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700">{event.description || event.short_description}</p>
            </div>
          )}

          {/* Action Icons - Prominent when expanded */}
          <div className="flex items-center gap-4 py-4 border-y border-gray-200">
            {/* Favorite */}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                isFavorited
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              )}
            >
              <Heart size={20} className={isFavorited ? "fill-current" : ""} />
              <span className="text-sm font-medium">
                {isFavorited ? "Gespeichert" : "Speichern"}
              </span>
            </button>

            {/* Calendar Export */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                exportToCalendar();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all"
            >
              <CalendarPlus size={20} />
              <span className="text-sm font-medium">Kalender</span>
            </button>

            {/* Share */}
            <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all"
                >
                  <Share2 size={20} />
                  <span className="text-sm font-medium">Teilen</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareViaWhatsApp();
                      setShowSharePopup(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-left"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareViaEmail();
                      setShowSharePopup(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-left"
                  >
                    E-Mail
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Tickets */}
            {(event.ticket_url || event.url) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTicketClick();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                <ShoppingCart size={20} />
                <span className="text-sm font-medium">Tickets</span>
              </button>
            )}
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200">
            {(event.start_date || (event.tags && event.tags.includes('ganzjährig'))) && (
              <div>
                <span className="text-xs font-medium text-gray-500">Datum</span>
                <p className="text-sm text-gray-900">
                  {event.tags && event.tags.includes('ganzjährig')
                    ? 'Ganzjährig'
                    : new Date(event.start_date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                  }
                </p>
              </div>
            )}
            {(event.venue_name || event.address_city) && (
              <div>
                <span className="text-xs font-medium text-gray-500">Ort</span>
                <p className="text-sm text-gray-900">{event.venue_name || event.address_city}</p>
              </div>
            )}
            {event.price_info && (
              <div>
                <span className="text-xs font-medium text-gray-500">Preis</span>
                <p className="text-sm text-gray-900">{event.price_info}</p>
              </div>
            )}
          </div>

          {/* Image Gallery */}
          {event.gallery_urls && event.gallery_urls.length > 0 && (
            <ImageGallery images={event.gallery_urls} />
          )}

          {/* Link to detail page */}
          <Link
            to={`/event/${event.external_id || event.id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Zur Detailseite
            <ChevronDown className="rotate-[-90deg]" size={16} />
          </Link>
        </div>
      )}

      {/* Expand/Collapse Indicator */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        {expanded ? (
          <>
            <span>Weniger anzeigen</span>
            <ChevronUp size={14} />
          </>
        ) : (
          <>
            <span>Mehr anzeigen</span>
            <ChevronDown size={14} />
          </>
        )}
      </button>
    </div>
  );
};
