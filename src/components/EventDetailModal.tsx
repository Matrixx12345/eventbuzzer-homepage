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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Image - Full Width without padding */}
        {event.image_url && (
          <div className="relative w-full h-[400px] overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}

        <div className="px-8 pb-8 pt-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-serif">{event.title}</DialogTitle>
          </DialogHeader>

          {/* Action Buttons: Favoriten + Kalender + Share + Ticket */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <Heart
                size={20}
                className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"}
              />
              <span className="text-sm font-medium text-gray-700">
                {isFavorited ? "Gespeichert" : "Speichern"}
              </span>
            </button>

            {/* Calendar Button */}
            <button
              onClick={exportToCalendar}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <CalendarPlus size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Kalender</span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                  Im privaten Kalender speichern
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1 mx-auto" />
              </div>
            </button>

            {/* Share Button with Popover (WhatsApp & Email) */}
            <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Event teilen"
                >
                  <Share2 size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Teilen</span>
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

            {/* Ticket purchase button - always visible with border */}
            <button
              onClick={() => {
                if (event.ticket_url || event.url) {
                  window.open(event.ticket_url || event.url, '_blank');
                } else {
                  toast.info("Ticket-Verkauf demnächst verfügbar");
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Ticket kaufen"
            >
              <ShoppingCart size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Ticket kaufen</span>
            </button>
          </div>

          {/* Tags Pills - below action buttons */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {event.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {event.description && (
            <div className="space-y-4">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
              {/* Detail anzeigen link - blue underlined link below description */}
              <Link
                to={`/event/${event.external_id || event.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
              >
                <span>Detail anzeigen</span>
                <ExternalLink size={16} />
              </Link>
            </div>
          )}

          {/* Image Gallery - only show if there are gallery images */}
          {event.gallery_urls && event.gallery_urls.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <ImageGallery images={event.gallery_urls} alt={event.title} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {event.start_date && (
              <div>
                <p className="text-sm font-semibold text-gray-500">Datum</p>
                <p>{new Date(event.start_date).toLocaleDateString('de-CH')}</p>
              </div>
            )}

            {event.venue_name && (
              <div>
                <p className="text-sm font-semibold text-gray-500">Ort</p>
                <p>{event.venue_name}</p>
              </div>
            )}

            {event.price_from !== null && event.price_from !== undefined && (
              <div>
                <p className="text-sm font-semibold text-gray-500">Preis</p>
                <p>
                  {event.price_from === 0
                    ? 'Gratis'
                    : `CHF ${event.price_from}${event.price_to ? ` - ${event.price_to}` : '+'}`
                  }
                </p>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
