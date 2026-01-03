import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  MapPin,
  Calendar,
  Navigation,
  ExternalLink,
  Share2,
  CalendarPlus,
  Copy,
  Mail,
  X,
  Loader2,
} from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackEventReferral, isExternalReferral } from "@/services/buzzTracking";
import { getNearestPlace } from "@/utils/swissPlaces";
import { BuzzTracker } from "@/components/BuzzTracker";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { ImageGallery } from "@/components/ImageGallery";
import ImageAttribution from "@/components/ImageAttribution";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Fallback image
import weekendJazz from "@/assets/weekend-jazz.jpg";

interface DynamicEvent {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  long_description?: string;
  short_description?: string;
  venue_name?: string;
  address_street?: string;
  address_city?: string;
  address_zip?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  image_author?: string | null;
  image_license?: string | null;
  price_from?: number;
  price_to?: number;
  price_label?: string;
  ticket_link?: string;
  latitude?: number;
  longitude?: number;
  category_sub_id?: string;
  created_at?: string;
  gallery_urls?: string[];
  buzz_score?: number | null;
}

const COUNTRY_NAMES = [
  "schweiz", "switzerland", "suisse", "svizzera",
  "germany", "deutschland", "france", "frankreich",
  "austria", "österreich", "italy", "italien", "liechtenstein",
];

const isCountryName = (str?: string) => {
  if (!str) return true;
  return COUNTRY_NAMES.includes(str.toLowerCase().trim());
};

const getEventLocation = (event: DynamicEvent): string => {
  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountryName(city)) {
    return city;
  }
  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountryName(event.venue_name)) {
    return event.venue_name.trim();
  }
  if (event.location && !isCountryName(event.location)) {
    return event.location.trim();
  }
  if (event.latitude && event.longitude) {
    return getNearestPlace(event.latitude, event.longitude);
  }
  return "";
};

const getDistanceInfo = (lat: number, lng: number): { city: string; distance: string } => {
  const centers = [
    { name: "Zürich", lat: 47.3769, lng: 8.5417 },
    { name: "Genf", lat: 46.2044, lng: 6.1432 },
    { name: "Basel", lat: 47.5596, lng: 7.5886 },
    { name: "Bern", lat: 46.948, lng: 7.4474 },
    { name: "Lausanne", lat: 46.5197, lng: 6.6323 },
    { name: "Luzern", lat: 47.0502, lng: 8.3093 },
  ];

  let nearest = centers[0], minDist = Infinity;
  centers.forEach((c) => {
    const d = Math.sqrt(Math.pow((lat - c.lat) * 111, 2) + Math.pow((lng - c.lng) * 85, 2));
    if (d < minDist) {
      minDist = d;
      nearest = c;
    }
  });

  if (minDist < 5) {
    return { city: nearest.name, distance: `In ${nearest.name}` };
  }

  const dLat = lat - nearest.lat;
  const dLng = lng - nearest.lng;
  let direction = "";
  if (Math.round(minDist) > 2) {
    if (dLat > 0.02) direction += "N";
    else if (dLat < -0.02) direction += "S";
    if (dLng > 0.02) direction += "O";
    else if (dLng < -0.02) direction += "W";
  }

  const distanceText = direction
    ? `~${Math.round(minDist)} km ${direction} von ${nearest.name}`
    : `~${Math.round(minDist)} km von ${nearest.name}`;

  return { city: nearest.name, distance: distanceText };
};

interface EventDetailModalProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailModal = ({ eventId, open, onOpenChange }: EventDetailModalProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [dynamicEvent, setDynamicEvent] = useState<DynamicEvent | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const referralTrackedRef = useRef(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowFullDescription(false);
      setDynamicEvent(null);
      setShareOpen(false);
      referralTrackedRef.current = false;
    }
  }, [open]);

  // Fetch event when modal opens
  useEffect(() => {
    if (open && eventId) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke("get-external-events", {
            body: { eventId }
          });
          if (error) throw error;
          if (data?.events?.[0]) {
            setDynamicEvent(data.events[0]);
          }
        } catch (err) {
          console.error("Error fetching event:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [open, eventId]);

  // Track referral visits
  useEffect(() => {
    if (dynamicEvent && !referralTrackedRef.current && isExternalReferral()) {
      referralTrackedRef.current = true;
      trackEventReferral(dynamicEvent.id);
    }
  }, [dynamicEvent]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("de-CH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  if (!eventId) return null;

  // Build event display data
  let event: {
    image: string;
    title: string;
    venue: string;
    location: string;
    address?: string;
    date: string;
    time: string;
    distance: string;
    description: string;
    ticketLink?: string;
    priceFrom?: number;
    priceTo?: number;
    priceLabel?: string;
    latitude?: number;
    longitude?: number;
    imageAuthor?: string | null;
    imageLicense?: string | null;
    isMuseum?: boolean;
    buzzScore?: number | null;
    galleryUrls?: string[];
  };

  if (dynamicEvent) {
    const addressParts = [
      dynamicEvent.address_street,
      [dynamicEvent.address_zip, dynamicEvent.address_city].filter(Boolean).join(" "),
      "Schweiz"
    ].filter(Boolean);

    const hasValidImage = dynamicEvent.image_url && dynamicEvent.image_url.trim() !== '';
    const isMuseum = dynamicEvent.category_sub_id === 'museum-kunst' || dynamicEvent.external_id?.startsWith('manual_');
    const isPermanentAttraction = !dynamicEvent.start_date;

    let dateDisplay: string;
    let timeDisplay: string;

    if (isMuseum) {
      dateDisplay = "";
      timeDisplay = "";
    } else if (isPermanentAttraction) {
      dateDisplay = "Jederzeit verfügbar";
      timeDisplay = "";
    } else {
      dateDisplay = formatDate(dynamicEvent.start_date) || "Datum folgt";
      timeDisplay = formatTime(dynamicEvent.start_date) || "";
    }

    const locationName = getEventLocation(dynamicEvent);
    const distanceInfo = dynamicEvent.latitude && dynamicEvent.longitude
      ? getDistanceInfo(dynamicEvent.latitude, dynamicEvent.longitude)
      : null;

    event = {
      image: hasValidImage ? dynamicEvent.image_url! : weekendJazz,
      title: dynamicEvent.title,
      venue: dynamicEvent.venue_name || (dynamicEvent.location !== dynamicEvent.title ? dynamicEvent.location : null) || "",
      location: locationName || "Schweiz",
      address: addressParts.length > 0 ? addressParts.join(", ") : "",
      date: dateDisplay,
      time: timeDisplay,
      distance: distanceInfo?.distance || "",
      description: dynamicEvent.long_description || dynamicEvent.description || dynamicEvent.short_description || "Beschreibung folgt.",
      ticketLink: dynamicEvent.ticket_link,
      priceFrom: dynamicEvent.price_from,
      priceTo: dynamicEvent.price_to,
      priceLabel: dynamicEvent.price_label,
      latitude: dynamicEvent.latitude,
      longitude: dynamicEvent.longitude,
      imageAuthor: dynamicEvent.image_author,
      imageLicense: dynamicEvent.image_license,
      isMuseum,
      buzzScore: dynamicEvent.buzz_score,
      galleryUrls: dynamicEvent.gallery_urls || [],
    };
  } else {
    event = {
      image: weekendJazz,
      title: loading ? "Lädt..." : "Event nicht gefunden",
      venue: "",
      location: "",
      date: "",
      time: "",
      distance: "",
      description: loading ? "" : "Dieses Event konnte nicht gefunden werden.",
    };
  }

  const handleCalendarExport = () => {
    const startDate = dynamicEvent?.start_date 
      ? new Date(dynamicEvent.start_date) 
      : new Date();
    
    const endDate = dynamicEvent?.end_date 
      ? new Date(dynamicEvent.end_date) 
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const escapeICS = (text: string) => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };
    
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    const shortDesc = event.description?.substring(0, 200) || '';
    const fullDescription = `${shortDesc}${shortDesc.length >= 200 ? '...' : ''}\\n\\nMehr Infos auf EventBuzzer: ${eventUrl}`;
    
    const locationStr = [event.venue, event.address].filter(Boolean).join(', ');
    const uid = `${eventId}-${Date.now()}@eventbuzzer.ch`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventBuzzer//Event Calendar//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(fullDescription)}`,
      `LOCATION:${escapeICS(locationStr)}`,
      `URL:${eventUrl}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    toast({
      title: "Kalender-Export",
      description: "Die .ics Datei wurde heruntergeladen.",
    });
  };

  const eventUrl = `${window.location.origin}/event/${eventId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <>
            {/* Hero Image */}
            <div className="relative h-64 sm:h-80 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = weekendJazz;
                }}
              />
              <ImageAttribution 
                author={event.imageAuthor} 
                license={event.imageLicense} 
                alwaysVisible 
              />
              
              {/* Close button overlay */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
              >
                <X size={20} className="text-neutral-700" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Title */}
              <DialogHeader className="mb-4">
                <DialogTitle className="font-serif text-neutral-900 text-2xl sm:text-3xl font-bold leading-tight text-left">
                  {event.title}
                </DialogTitle>
              </DialogHeader>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-[12px] text-gray-500">
                {event.isMuseum && (
                  <span className="uppercase tracking-wide">Museum</span>
                )}
                
                {!event.isMuseum && event.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{event.date}{event.time ? `, ${event.time}` : ''}</span>
                  </div>
                )}
                
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" />
                    <span>
                      {event.location}
                      {event.distance && <span className="text-gray-400 ml-1">• {event.distance}</span>}
                    </span>
                  </div>
                )}
                
                {event.venue && event.venue !== event.location && (
                  <div className="flex items-center gap-1.5">
                    <Navigation size={14} className="text-gray-400" />
                    <span>{event.venue}</span>
                  </div>
                )}
                
                {(event.priceLabel || event.priceFrom) && (
                  <span className="text-gray-700 font-medium">
                    {event.priceLabel 
                      ? event.priceLabel 
                      : event.priceTo && event.priceTo !== event.priceFrom
                        ? `CHF ${event.priceFrom} – ${event.priceTo}`
                        : `ab CHF ${event.priceFrom}`}
                  </span>
                )}
                
                <BuzzTracker buzzScore={event.buzzScore} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mb-6">
                {event.ticketLink ? (
                  <a 
                    href={event.ticketLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Tickets kaufen <ExternalLink size={16} />
                  </a>
                ) : (
                  <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                    Get Tickets
                  </button>
                )}
                
                <button
                  onClick={() => toggleFavorite({ 
                    id: eventId, 
                    slug: eventId, 
                    image: event.image, 
                    title: event.title, 
                    venue: event.venue, 
                    location: event.location,
                    date: event.date
                  })}
                  className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  title="Zu Favoriten hinzufügen"
                >
                  <Heart size={20} className={isFavorite(eventId) ? "fill-red-500 text-red-500" : "text-neutral-400"} />
                </button>
                
                {/* Share */}
                {isMobile ? (
                  <button
                    onClick={async () => {
                      const shareData = {
                        title: event.title,
                        text: `Schau dir dieses Event an: ${event.title}`,
                        url: eventUrl,
                      };
                      
                      if (navigator.share) {
                        try {
                          await navigator.share(shareData);
                        } catch {
                          // User cancelled
                        }
                      } else {
                        try {
                          await navigator.clipboard.writeText(eventUrl);
                          toast({
                            title: "Link kopiert!",
                            description: "Der Event-Link wurde in die Zwischenablage kopiert.",
                          });
                        } catch {
                          toast({
                            title: "Fehler",
                            description: "Link konnte nicht kopiert werden.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    title="Teilen"
                  >
                    <Share2 size={20} className="text-neutral-400" />
                  </button>
                ) : (
                  <Popover open={shareOpen} onOpenChange={setShareOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                        title="Teilen"
                      >
                        <Share2 size={20} className="text-neutral-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-white shadow-lg border border-neutral-200" align="end">
                      <div className="flex flex-col">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(eventUrl);
                              toast({
                                title: "Link kopiert!",
                                description: "Der Event-Link wurde in die Zwischenablage kopiert.",
                              });
                              setShareOpen(false);
                            } catch {
                              toast({
                                title: "Fehler",
                                description: "Link konnte nicht kopiert werden.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                        >
                          <Copy size={18} className="text-neutral-500" />
                          <span className="text-sm text-neutral-700">Link kopieren</span>
                        </button>
                        
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Schau dir dieses Event an: ${event.title}\n${eventUrl}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShareOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-green-600" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="text-sm text-neutral-700">WhatsApp</span>
                        </a>
                        
                        <a
                          href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Schau dir dieses Event an:\n\n${event.title}\n${eventUrl}`)}`}
                          onClick={() => setShareOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <Mail size={18} className="text-neutral-500" />
                          <span className="text-sm text-neutral-700">E-Mail</span>
                        </a>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                <button
                  onClick={handleCalendarExport}
                  className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  title="In Kalender eintragen"
                >
                  <CalendarPlus size={20} className="text-neutral-400" />
                </button>
              </div>

              {/* Description */}
              <div className="border-t border-neutral-100 pt-6">
                <h2 className="font-serif text-neutral-900 text-lg font-semibold mb-3">Über dieses Event</h2>
                <div className={`text-neutral-600 leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                  <p>{event.description}</p>
                </div>
                {event.description && event.description.length > 200 && !showFullDescription && (
                  <button 
                    onClick={() => setShowFullDescription(true)}
                    className="text-neutral-900 text-sm underline mt-3 hover:text-neutral-600 transition-colors"
                  >
                    mehr lesen
                  </button>
                )}
                
                {/* Rating buttons */}
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <EventRatingButtons eventId={eventId} eventTitle={event.title} />
                </div>

                {/* Image Gallery */}
                {event.galleryUrls && event.galleryUrls.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-neutral-100">
                    <ImageGallery images={event.galleryUrls} alt={event.title} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
