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
  ArrowRight,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";
import { supabase } from "@/integrations/supabase/client";
import { externalSupabase } from "@/integrations/supabase/externalClient";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Fallback image
import weekendJazz from "@/assets/weekend-jazz.jpg";


// Partner products
import partnerChampagne from "@/assets/partner-champagne.jpg";
import partnerRoses from "@/assets/partner-roses.jpg";
import partnerTeddy from "@/assets/partner-teddy.jpg";
import partnerChocolate from "@/assets/partner-chocolate.jpg";
import rainySpa from "@/assets/rainy-spa.jpg";
import weekendWine from "@/assets/weekend-wine.jpg";
import weekendArt from "@/assets/weekend-art.jpg";
import rainyChocolate from "@/assets/rainy-chocolate.jpg";

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
  opening_hours_note?: string;
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

// Similar event type
interface SimilarEvent {
  id: string;
  image: string;
  title: string;
  venue: string;
  location: string;
  date: string;
}

// Partner products
const partnerProducts = [
  { image: partnerRoses, name: "12 Red Roses Bouquet", price: "CHF 39", partner: "Fleurop" },
  { image: partnerChampagne, name: "Moët & Chandon Impérial", price: "CHF 49", partner: "Galaxus" },
  { image: partnerChocolate, name: "Lindt Pralinés Selection", price: "CHF 29", partner: "Lindt" },
  { image: partnerTeddy, name: "Premium Teddy Bear", price: "CHF 35", partner: "Manor" },
  { image: rainySpa, name: "Late Night Spa Access", price: "CHF 79", partner: "Hürlimann" },
  { image: weekendWine, name: "Scented Candle Set", price: "CHF 45", partner: "Westwing" },
  { image: weekendArt, name: "Cashmere Red Gloves", price: "CHF 89", partner: "Globus" },
  { image: rainyChocolate, name: "Artisan Coffee Set", price: "CHF 55", partner: "Sprüngli" },
];

// Similar Event Card
const SimilarEventCard = ({ id, image, title, venue, location, date, onSwap }: SimilarEvent & {
  onSwap: (eventId: string) => void;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (id && id.trim() !== '') {
      onSwap(id);
    }
  };
  
  return (
    <button 
      type="button"
      onClick={handleClick}
      className="block group h-full cursor-pointer text-left w-full hover:opacity-95 active:scale-[0.98] transition-all"
    >
      <article className="bg-white rounded-xl overflow-hidden h-full border border-neutral-200 hover:shadow-lg transition-shadow duration-300">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image || weekendJazz}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = weekendJazz;
            }}
          />
        </div>
        <div className="p-3 pointer-events-none">
          <p className="text-neutral-500 text-xs mb-1">{date}</p>
          <h3 className="font-serif text-neutral-900 text-sm font-semibold leading-tight mb-1 line-clamp-1">{title}</h3>
          <p className="text-neutral-500 text-xs line-clamp-1">{venue} • {location}</p>
        </div>
      </article>
    </button>
  );
};

// Partner Product Card
const PartnerProductCard = ({ image, name, price, partner }: {
  image: string;
  name: string;
  price: string;
  partner: string;
}) => {
  return (
    <article className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/5]">
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white/70 text-[9px] uppercase tracking-wider mb-0.5">via {partner}</p>
        <h3 className="text-white font-serif text-sm font-semibold leading-tight mb-1 line-clamp-2">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-semibold">{price}</span>
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-2 py-1 rounded-full text-[10px] font-medium transition-colors flex items-center gap-0.5">
            <Plus size={10} /> Add
          </button>
        </div>
      </div>
    </article>
  );
};

// Event cache for faster repeated loads
const eventCache = new Map<string, { event: DynamicEvent; similar: SimilarEvent[] }>();

// Skeleton component for loading state
const ModalSkeleton = () => (
  <div className="animate-pulse">
    {/* Hero skeleton */}
    <div className="h-48 sm:h-56 bg-neutral-200" />
    
    {/* Content skeleton */}
    <div className="p-5 sm:p-6 space-y-4">
      {/* Title */}
      <div className="h-7 bg-neutral-200 rounded-md w-3/4" />
      
      {/* Meta info */}
      <div className="flex gap-3">
        <div className="h-4 bg-neutral-100 rounded w-24" />
        <div className="h-4 bg-neutral-100 rounded w-32" />
        <div className="h-4 bg-neutral-100 rounded w-20" />
      </div>
      
      {/* Buttons */}
      <div className="flex gap-2">
        <div className="h-10 bg-neutral-200 rounded-lg w-32" />
        <div className="h-10 bg-neutral-100 rounded-lg w-10" />
        <div className="h-10 bg-neutral-100 rounded-lg w-10" />
      </div>
      
      {/* Description */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <div className="h-5 bg-neutral-200 rounded w-40 mb-3" />
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-5/6" />
        <div className="h-4 bg-neutral-100 rounded w-4/5" />
      </div>
    </div>
    
    {/* Similar events skeleton */}
    <div className="bg-stone-50 px-5 sm:px-6 py-5">
      <div className="h-6 bg-neutral-200 rounded w-40 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-white border border-neutral-200">
            <div className="aspect-video bg-neutral-200" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-neutral-100 rounded w-16" />
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-3 bg-neutral-100 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface EventDetailModalProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSwap?: (eventId: string) => void;
}

export const EventDetailModal = ({ eventId, open, onOpenChange, onEventSwap }: EventDetailModalProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [dynamicEvent, setDynamicEvent] = useState<DynamicEvent | null>(null);
  const [similarEvents, setSimilarEvents] = useState<SimilarEvent[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const isMobile = useIsMobile();
const [loading, setLoading] = useState(false);
  const referralTrackedRef = useRef(false);
  const [needsReadMore, setNeedsReadMore] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [nearbyEvents, setNearbyEvents] = useState<SimilarEvent[]>([]);
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowFullDescription(false);
      setDynamicEvent(null);
      setSimilarEvents([]);
      setNearbyEvents([]);
      setShareOpen(false);
      referralTrackedRef.current = false;
      setNeedsReadMore(false);
    }
  }, [open]);

  // Check if description needs "read more" (more than 6 lines)
  useEffect(() => {
    if (descriptionRef.current && !showFullDescription) {
      const lineHeight = parseFloat(getComputedStyle(descriptionRef.current).lineHeight);
      const height = descriptionRef.current.scrollHeight;
      const lines = Math.ceil(height / lineHeight);
      setNeedsReadMore(lines > 6);
    }
  }, [dynamicEvent, showFullDescription]);

  // Fetch event when modal opens OR eventId changes (for swap)
  useEffect(() => {
    if (open && eventId) {
      // Reset UI state immediately when eventId changes
      setShowFullDescription(false);
      setNeedsReadMore(false);
      
      // Check cache first
      const cached = eventCache.get(eventId);
      if (cached) {
        setDynamicEvent(cached.event);
        setSimilarEvents(cached.similar);
        setLoading(false);
        return;
      }
      
      // Not cached - fetch from API
      setDynamicEvent(null);
      setSimilarEvents([]);
      setNearbyEvents([]);
      
      const fetchEvent = async () => {
        setLoading(true);
        try {
          // Fetch main event
          const { data, error } = await supabase.functions.invoke("get-external-events", {
            body: { eventId }
          });
          if (error) throw error;
          if (data?.events?.[0]) {
            const eventData = data.events[0];
            setDynamicEvent(eventData);
            
            // Fetch similar events (random 4 events, excluding current)
            const { data: similarData } = await supabase.functions.invoke("get-external-events", {
              body: { limit: 8 }
            });
            
            let similarList: SimilarEvent[] = [];
            if (similarData?.events) {
              similarList = similarData.events
                .filter((e: DynamicEvent) => e.id !== eventId && e.external_id !== eventId)
                .slice(0, 4)
                .map((e: DynamicEvent) => ({
                  id: e.external_id || e.id,
                  image: e.image_url || weekendJazz,
                  title: e.title,
                  venue: e.venue_name || '',
                  location: getEventLocation(e),
                  date: e.start_date 
                    ? new Date(e.start_date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })
                    : ''
                }));
              setSimilarEvents(similarList);
            }
            
            // Fetch nearby events if coordinates available
            if (eventData.latitude && eventData.longitude) {
              const { data: nearbyData } = await externalSupabase.rpc('get_nearby_events', {
                current_event_id: eventData.id,
                current_lat: eventData.latitude,
                current_lng: eventData.longitude,
                radius_km: 10
              });
              
              if (nearbyData && Array.isArray(nearbyData) && nearbyData.length > 0) {
                const nearbyList = nearbyData.slice(0, 6).map((e: any) => ({
                  id: e.external_id || e.id,
                  image: e.image_url || weekendJazz,
                  title: e.title,
                  venue: e.venue_name || '',
                  location: getEventLocation(e),
                  date: e.start_date 
                    ? new Date(e.start_date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })
                    : ''
                }));
                setNearbyEvents(nearbyList);
              }
            }
            
            // Cache for future use
            eventCache.set(eventId, { event: eventData, similar: similarList });
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
      // Use opening_hours_note if available, fallback to "Jederzeit verfügbar"
      dateDisplay = dynamicEvent.opening_hours_note || "Jederzeit verfügbar";
      timeDisplay = "";  // No time for permanent attractions
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 [&>button]:hidden">
        {/* Sticky Close Button Container */}
        <div className="sticky top-0 z-50 h-0 pointer-events-none">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 pointer-events-auto w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-all border border-neutral-200"
            aria-label="Schließen"
          >
            <X size={20} className="text-neutral-700" />
          </button>
        </div>
        
        {loading ? (
          <ModalSkeleton />
        ) : (
          <>
            {/* Hero Image - smaller */}
            <div className="relative h-48 sm:h-56 overflow-hidden">
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
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6">
              {/* Title */}
              <DialogHeader className="mb-3">
                <DialogTitle className="font-serif text-neutral-900 text-xl sm:text-2xl font-bold leading-tight text-left">
                  {event.title}
                </DialogTitle>
              </DialogHeader>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-gray-500">
                {event.isMuseum && (
                  <span className="uppercase tracking-wide">Museum</span>
                )}
                
                {!event.isMuseum && event.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span>{event.date}{event.time ? `, ${event.time}` : ''}</span>
                  </div>
                )}
                
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-gray-400" />
                    <span>
                      {event.location}
                      {event.distance && <span className="text-gray-400 ml-1">• {event.distance}</span>}
                    </span>
                  </div>
                )}
                
                {event.venue && event.venue !== event.location && (
                  <div className="flex items-center gap-1.5">
                    <Navigation size={12} className="text-gray-400" />
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
                
                {/* Report Flag - inline */}
                <EventRatingButtons eventId={eventId} eventTitle={event.title} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mb-4">
                {event.ticketLink ? (
                  <a 
                    href={event.ticketLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    Tickets kaufen <ExternalLink size={14} />
                  </a>
                ) : (
                  <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
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
                  className="p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  title="Zu Favoriten hinzufügen"
                >
                  <Heart size={18} className={isFavorite(eventId) ? "fill-red-500 text-red-500" : "text-neutral-400"} />
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
                    className="p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    title="Teilen"
                  >
                    <Share2 size={18} className="text-neutral-400" />
                  </button>
                ) : (
                  <Popover open={shareOpen} onOpenChange={setShareOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                        title="Teilen"
                      >
                        <Share2 size={18} className="text-neutral-400" />
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
                  className="p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  title="In Kalender eintragen"
                >
                  <CalendarPlus size={18} className="text-neutral-400" />
                </button>
              </div>

              {/* Description */}
              <div className="border-t border-neutral-100 pt-4">
                <h2 className="font-serif text-neutral-900 text-base font-semibold mb-2">Über dieses Event</h2>
                <div className={`text-neutral-600 text-sm leading-relaxed ${!showFullDescription ? 'line-clamp-6' : ''}`}>
                  <p ref={descriptionRef}>{event.description}</p>
                </div>
                {needsReadMore && !showFullDescription && (
                  <button 
                    onClick={() => setShowFullDescription(true)}
                    className="text-neutral-900 text-xs underline mt-2 hover:text-neutral-600 transition-colors"
                  >
                    mehr lesen
                  </button>
                )}
                

                {/* Image Gallery */}
                {event.galleryUrls && event.galleryUrls.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <ImageGallery images={event.galleryUrls} alt={event.title} />
                  </div>
                )}
              </div>
            </div>

            {/* Nearby Events Section */}
            {nearbyEvents.length > 0 && (
              <div className="bg-stone-50 px-5 sm:px-6 py-5 border-t border-stone-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-neutral-500" />
                    <h2 className="font-serif text-neutral-900 text-lg font-bold">In der Nähe</h2>
                  </div>
                </div>
                
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-3">
                    {nearbyEvents.map((evt) => (
                      <CarouselItem key={evt.id} className="pl-3 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                        <SimilarEventCard {...evt} onSwap={onEventSwap || (() => {})} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex -left-3 bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 h-8 w-8" />
                  <CarouselNext className="hidden sm:flex -right-3 bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 h-8 w-8" />
                </Carousel>
              </div>
            )}

            {/* Similar Events Section */}
            <div className="bg-stone-50 px-5 sm:px-6 py-5 border-t border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-neutral-900 text-lg font-bold">Ähnliche Events</h2>
                <Link 
                  to="/" 
                  onClick={() => onOpenChange(false)}
                  className="text-neutral-600 hover:text-neutral-900 text-xs font-medium flex items-center gap-1"
                >
                  Alle ansehen <ArrowRight size={12} />
                </Link>
              </div>

              {similarEvents.length > 0 ? (
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-3">
                    {similarEvents.map((evt) => (
                      <CarouselItem key={evt.id} className="pl-3 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                        <SimilarEventCard {...evt} onSwap={onEventSwap || (() => {})} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex -left-3 bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 h-8 w-8" />
                  <CarouselNext className="hidden sm:flex -right-3 bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 h-8 w-8" />
                </Carousel>
              ) : (
                <div className="text-center text-neutral-400 text-sm py-4">
                  Ähnliche Events werden geladen...
                </div>
              )}
            </div>

            {/* Partner Products Section */}
            <div className="bg-stone-50 px-5 sm:px-6 py-5 border-t border-stone-200">
              <div className="text-center mb-4">
                <h2 className="font-serif text-neutral-900 text-lg font-bold mb-1">Unvergessliche Augenblicke</h2>
                <p className="text-neutral-500 text-xs">Curated additions to enhance your experience</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {partnerProducts.slice(0, 4).map((product, index) => (
                  <PartnerProductCard key={index} {...product} />
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
