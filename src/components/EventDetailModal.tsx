import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, CalendarPlus, Share2, ExternalLink, ShoppingCart, Copy, Mail } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFavorites } from '@/contexts/FavoritesContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ImageGallery } from '@/components/ImageGallery';

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

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, isOpen, onClose }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showSharePopup, setShowSharePopup] = useState(false);

  if (!event) return null;

  const isFavorited = isFavorite(event.id);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl">
        {/* Hero Image with Title and Description Overlay */}
        {event.image_url && (
          <div className="relative w-full h-[300px] overflow-hidden rounded-t-lg">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Tags Pills - oben links */}
            {event.tags && event.tags.length > 0 && (
              <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
                {event.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-white/80 backdrop-blur-sm text-gray-800 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded"
                  >
                    {formatTagName(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* Title and Description on Image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold mb-2">{event.title}</DialogTitle>
              </DialogHeader>
              {event.short_description && (
                <p className="text-sm text-white/90 line-clamp-2 leading-relaxed">
                  {event.short_description}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* Action Buttons: Favoriten + Kalender + Share + Stars + Ticket */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Favorite Button - Circular glassmorphism, icon only */}
            <button
              onClick={handleToggleFavorite}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-gray-200/50 text-gray-700 hover:bg-white/80 hover:scale-105 transition-all shadow-sm"
              title={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <Heart
                size={20}
                className={isFavorited ? "fill-current text-red-500" : ""}
              />
            </button>

            {/* Calendar Button - Circular glassmorphism, icon only */}
            <button
              onClick={exportToCalendar}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-gray-200/50 text-gray-700 hover:bg-white/80 hover:scale-105 transition-all shadow-sm"
              title="Im Kalender speichern"
            >
              <CalendarPlus size={20} />
            </button>

            {/* Share Button - Circular glassmorphism, icon only */}
            <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-gray-200/50 text-gray-700 hover:bg-white/80 hover:scale-105 transition-all shadow-sm"
                  title="Event teilen"
                >
                  <Share2 size={20} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1">
                  {/* Link kopieren */}
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

                  {/* WhatsApp */}
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

                  {/* Email */}
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

            {/* Rating - Single star with number */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-gray-200/50 text-gray-700 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm font-bold">
                  {((event.buzz_score || event.relevance_score || 75) / 20).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Ticket purchase button - Dunkelblau wie im Referenzbild */}
            <button
              onClick={() => {
                if (event.ticket_url || event.url) {
                  window.open(event.ticket_url || event.url, '_blank');
                } else {
                  toast.info("Ticket-Verkauf demnächst verfügbar");
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
              title="Ticket kaufen"
            >
              <span className="text-sm font-semibold text-white">Ticket kaufen</span>
            </button>
          </div>

          {/* Compact Details - nur die wichtigsten Infos */}
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-2">
            {(event.start_date || (event.tags && event.tags.includes('ganzjährig'))) && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">📅</span>
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
                <span className="font-semibold">📍</span>
                <span>{event.venue_name}</span>
              </div>
            )}

            {event.price_from !== null && event.price_from !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">💰</span>
                <span>
                  {event.price_from === 0
                    ? 'Gratis'
                    : `CHF ${event.price_from}+`
                  }
                </span>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
