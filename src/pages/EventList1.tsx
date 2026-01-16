import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Maximize2, Minimize2, CalendarPlus, Share2, Copy, Mail, Sparkles, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EventsMap from "@/components/EventsMap";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toggleFavoriteApi } from "@/services/favorites";
import ChatbotPopupRight from "@/components/ChatbotPopupRight";
import { getLocationWithMajorCity, getNearestPlace } from "@/utils/swissPlaces";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";

const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

// Convert German umlaut replacements (from MySwitzerland API) to proper umlauts
const convertToUmlauts = (text: string | null | undefined): string => {
  if (!text) return "";
  const replacements: [string, string][] = [
    ["fuer", "für"], ["Fuer", "Für"],
    ["ueber", "über"], ["Ueber", "Über"],
    ["Aelteste", "Älteste"], ["aelteste", "älteste"],
    ["Aeltestes", "Ältestes"], ["aeltestes", "ältestes"],
    ["Aeltere", "Ältere"], ["aeltere", "ältere"],
    ["aelter", "älter"], ["Aelter", "Älter"],
    ["oeffentliche", "öffentliche"], ["Oeffentliche", "Öffentliche"],
    ["oeffentlichen", "öffentlichen"], ["Oeffentlichen", "Öffentlichen"],
    ["oeffentlicher", "öffentlicher"], ["Oeffentlicher", "Öffentlicher"],
    ["beruehmte", "berühmte"], ["Beruehmte", "Berühmte"],
    ["beruehmten", "berühmten"], ["Beruehmten", "Berühmten"],
    ["Weltberuehmte", "Weltberühmte"], ["weltberuehmte", "weltberühmte"],
    ["Weltberuehmten", "Weltberühmten"], ["weltberuehmten", "weltberühmten"],
    ["schoene", "schöne"], ["Schoene", "Schöne"],
    ["schoenen", "schönen"], ["Schoenen", "Schönen"],
    ["schoenste", "schönste"], ["Schoenste", "Schönste"],
    ["grossartige", "großartige"], ["Grossartige", "Großartige"],
    ["groesste", "größte"], ["Groesste", "Größte"],
    ["groessere", "größere"], ["Groessere", "Größere"],
    ["hoechste", "höchste"], ["Hoechste", "Höchste"],
    ["fruehere", "frühere"], ["Fruehere", "Frühere"],
    ["taeglich", "täglich"], ["Taeglich", "Täglich"],
    ["jaehrlich", "jährlich"], ["Jaehrlich", "Jährlich"],
    ["natuerlich", "natürlich"], ["Natuerlich", "Natürlich"],
    ["kuenstlerische", "künstlerische"], ["Kuenstlerische", "Künstlerische"],
    ["Kuenstler", "Künstler"], ["kuenstler", "künstler"],
    ["Kuenstlern", "Künstlern"], ["kuenstlern", "künstlern"],
    ["Gemaelde", "Gemälde"], ["gemaelde", "gemälde"],
    ["Stueck", "Stück"], ["stueck", "stück"],
    ["Stuecke", "Stücke"], ["stuecke", "stücke"],
    ["Fuehrung", "Führung"], ["fuehrung", "führung"],
    ["Fuehrungen", "Führungen"], ["fuehrungen", "führungen"],
    ["Eroeffnung", "Eröffnung"], ["eroeffnung", "eröffnung"],
    ["Ausfluege", "Ausflüge"], ["ausfluege", "ausflüge"],
    ["Laerm", "Lärm"], ["laerm", "lärm"],
    ["Geraeusch", "Geräusch"], ["geraeusch", "geräusch"],
    ["Geraeusche", "Geräusche"], ["geraeusche", "geräusche"],
    ["Gebaeude", "Gebäude"], ["gebaeude", "gebäude"],
    ["Naehe", "Nähe"], ["naehe", "nähe"],
    ["Gaeste", "Gäste"], ["gaeste", "gäste"],
    ["Staedte", "Städte"], ["staedte", "städte"],
    ["Plaetze", "Plätze"], ["plaetze", "plätze"],
    ["Spaziergaenge", "Spaziergänge"], ["spaziergaenge", "spaziergänge"],
    ["Anfaenger", "Anfänger"], ["anfaenger", "anfänger"],
    ["Sehenswuerdigkeiten", "Sehenswürdigkeiten"], ["sehenswuerdigkeiten", "sehenswürdigkeiten"],
    ["Zuerich", "Zürich"], ["zuerich", "zürich"],
    ["Muenchen", "München"], ["muenchen", "münchen"],
    ["koennen", "können"], ["Koennen", "Können"],
    ["moechten", "möchten"], ["Moechten", "Möchten"],
    ["wuerden", "würden"], ["Wuerden", "Würden"],
    ["muessen", "müssen"], ["Muessen", "Müssen"],
    ["hoeren", "hören"], ["Hoeren", "Hören"],
    ["gehoert", "gehört"], ["Gehoert", "Gehört"],
    ["fuehrt", "führt"], ["Fuehrt", "Führt"],
    ["praesentiert", "präsentiert"], ["Praesentiert", "Präsentiert"],
    ["beruehrt", "berührt"], ["Beruehrt", "Berührt"],
    ["eroeffnet", "eröffnet"], ["Eroeffnet", "Eröffnet"],
    ["waehrend", "während"], ["Waehrend", "Während"],
  ];
  let result = text;
  for (const [from, to] of replacements) {
    result = result.split(from).join(to);
  }
  return result;
};

// Location-Logik von "Alle Events" übernommen
const getEventLocation = (event: Event): string => {
  const countryNames = [
    "schweiz", "switzerland", "suisse", "svizzera",
    "germany", "deutschland", "france", "frankreich",
    "austria", "österreich", "italy", "italien", "liechtenstein",
  ];

  const isCountry = (str?: string) => {
    if (!str) return true;
    return countryNames.includes(str.toLowerCase().trim());
  };

  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountry(city)) {
    return city;
  }

  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountry(event.venue_name)) {
    return event.venue_name.trim();
  }

  if (event.location && !isCountry(event.location)) {
    return event.location.trim();
  }

  if (event.latitude && event.longitude) {
    return getNearestPlace(event.latitude, event.longitude);
  }

  return "";
};

interface Event {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  short_description?: string;
  location?: string;
  venue_name?: string;
  address_city?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  price_from?: number;
  price_to?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  source?: string;
  relevance_score?: number;
  buzz_score?: number;
  favorite_count?: number;
  category_main_id?: number;
  category_sub_id?: number;
}

interface TaxonomyItem {
  id: number;
  slug: string;
  name: string;
  type: "main" | "sub";
  parent_id: number | null;
  display_order?: number;
  is_active?: boolean;
}

// Buzz Score Helper Function - Wärmere Farben (weniger rot, mehr orange)
const getBuzzColor = (score: number) => {
  if (score <= 20) return "#9ca3af"; // gray
  if (score <= 35) return "#a8a29e"; // stone
  if (score <= 45) return "#facc15"; // yellow
  if (score <= 55) return "#fbbf24"; // amber
  if (score <= 65) return "#f59e0b"; // amber-500
  if (score <= 75) return "#f97316"; // orange
  if (score <= 85) return "#fb923c"; // orange-400 (heller, wärmer)
  if (score <= 92) return "#f97316"; // orange (statt rot)
  return "#ea580c"; // deep orange (statt rot)
};


// Event Card Component
const EventCard = ({
  event,
  index,
  isFavorited,
  onToggleFavorite,
  isMapExpanded,
  onClick,
  similarEventsFilter,
  setSimilarEventsFilter,
  nearbyEventsFilter,
  setNearbyEventsFilter,
  setCurrentPage,
  setDisplayedEventsCount,
}: {
  event: Event;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: (event: Event) => void;
  isMapExpanded?: boolean;
  onClick?: (event: Event) => void;
  similarEventsFilter: string | null;
  setSimilarEventsFilter: (id: string | null) => void;
  nearbyEventsFilter: string | null;
  setNearbyEventsFilter: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setDisplayedEventsCount: (count: number) => void;
}) => {
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const imageUrl = event.image_url || getPlaceholderImage(index);

  // Location formatieren - EXAKT wie auf "Alle Events" Seite
  const locationName = getEventLocation(event);
  const locationText = event.latitude && event.longitude
    ? getLocationWithMajorCity(event.latitude, event.longitude, locationName)
    : (locationName || "Schweiz");

  // Use AI-generated short_description or full description - NO FALLBACK
  const description = event.short_description || event.description || "";

  const buzzScore = event.buzz_score || event.relevance_score || 75;
  const isHot = buzzScore >= 80;

  // Rating berechnen (0-5) basierend auf buzzScore (0-100)
  const rating = buzzScore / 20; // z.B. 75 / 20 = 3.75
  const goldStars = Math.floor(rating); // z.B. Math.floor(3.75) = 3
  const grayStars = 5 - goldStars; // z.B. 5 - 3 = 2

  return (
    <article
      onClick={() => onClick?.(event)}
      className="group bg-[#FDFBF7] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-stone-200 cursor-pointer"
    >
      <div className="flex gap-4 h-[165px]">
        {/* Image Section - 308px normal, 246px wenn Map groß (20% kleiner) */}
        <div className={cn(
          "relative h-[165px] flex-shrink-0 overflow-hidden transition-all duration-300",
          isMapExpanded ? "w-[246px]" : "w-[308px]"
        )}>
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 px-4 pt-4 pb-3 flex flex-col justify-between min-w-0">
          <div>
            {/* Title - ALWAYS 1 line only */}
            <h3 className="text-xl font-semibold text-stone-900 group-hover:text-amber-700 transition-colors mb-2 truncate leading-none font-sans">
              {event.title}
            </h3>

            {/* Location - NO PIN */}
            <div className="text-sm text-gray-500 mb-2">
              {locationText}

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

            {/* Short Description - AI Generated (fallback to description if needed) */}
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
          <div className="flex items-center gap-5">
            {/* Star Rating */}
            <div className="flex items-center gap-1.5">
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
                  onToggleFavorite(event);
                }}
                className="group/heart relative p-1.5 hover:scale-110 transition-all duration-200"
              >
                <Heart
                  size={19}
                  className={isFavorited ? "fill-red-600 text-red-600" : "text-gray-600"}
                />
                {/* Tooltip - Heller Stil */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/heart:block z-50 pointer-events-none">
                  <div className="bg-[#ffffff] text-gray-800 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-200">
                    {isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
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
              <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
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
                          setShowSharePopup(false);
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
                        setShowSharePopup(false);
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
                        setShowSharePopup(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <Mail size={18} className="text-neutral-500" />
                      <span className="text-sm text-neutral-700">E-Mail</span>
                    </a>
                  </div>
                </PopoverContent>
              </Popover>

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
                      setCurrentPage(1);
                      setDisplayedEventsCount(30);
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
                      setCurrentPage(1);
                      setDisplayedEventsCount(30);
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
};

// Calendar Export Helper (based on EventDetailModal.tsx)
const exportToCalendar = (event: Event) => {
  const formatDateForICS = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = event.start_date ? formatDateForICS(event.start_date) : '';
  const endDate = event.end_date ? formatDateForICS(event.end_date) : '';

  const location = event.venue_name || event.address_city || event.location || "Schweiz";
  const description = (event.short_description || event.description || "")
    .replace(/\n/g, '\\n');

  const eventUrl = `${window.location.origin}/event/${event.external_id || event.id}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventBuzzer//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@eventbuzzer.ch`,
    `DTSTAMP:${formatDateForICS(new Date().toISOString())}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description}\\n\\nMehr Infos: ${eventUrl}`,
    `LOCATION:${location}`,
    `URL:${eventUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success("Event zu Kalender hinzugefügt!");
};

// City coordinates for radius filtering (from Listings.tsx)
// WICHTIG: Deutsche Namen mit Umlauten, weil swissPlaces.ts auch deutsche Namen nutzt
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "zürich": { lat: 47.3769, lng: 8.5417 },
  "genf": { lat: 46.2044, lng: 6.1432 },
  "basel": { lat: 47.5596, lng: 7.5886 },
  "bern": { lat: 46.948, lng: 7.4474 },
  "lausanne": { lat: 46.5197, lng: 6.6323 },
  "luzern": { lat: 47.0502, lng: 8.3093 },
  "winterthur": { lat: 47.4984, lng: 8.7246 },
  "st. gallen": { lat: 47.4245, lng: 9.3767 },
  "lugano": { lat: 46.0037, lng: 8.9511 },
  "thun": { lat: 46.758, lng: 7.6280 },
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EventList1 = () => {
  const [rawEvents, setRawEvents] = useState<Event[]>([]); // Events from map (unfiltered)
  const [loading, setLoading] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Taxonomy state for subcategories
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedEventsCount, setDisplayedEventsCount] = useState(30);
  const EVENTS_PER_PAGE = 120; // Max 120 events per page
  const SCROLL_LOAD_INCREMENT = 30; // Load 30 more on scroll

  const { favorites, toggleFavorite } = useFavorites();
  const favoriteIds = favorites.map(f => f.id);
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState({
    category: null as string | null,
    categoryId: null as number | null,
    mood: null as string | null,
    city: "",
    radius: 25,
    time: null as string | null,
    date: undefined as Date | undefined,
    search: "",
  });

  // Similar & Nearby Events Filter (Amazon-style)
  const [similarEventsFilter, setSimilarEventsFilter] = useState<string | null>(null);
  const [nearbyEventsFilter, setNearbyEventsFilter] = useState<string | null>(null);

  // SIMPLE: Map Events Handler - stores raw events without filtering
  const handleMapEventsChange = useCallback((newEvents: Event[]) => {
    setRawEvents(newEvents);
    setLoading(false);
  }, []);

  const isFavorited = (eventId: string) => favorites.some(f => f.id === eventId);

  const handleToggleFavorite = useCallback(async (event: Event) => {
    const wasFavorite = isFavorited(event.id);
    const locationName = getEventLocation(event);

    // STEP 1: Update localStorage via FavoritesContext
    const favoriteData = {
      id: event.id,
      slug: event.external_id || event.id,
      title: event.title,
      venue: event.venue_name || "",
      image: event.image_url || getPlaceholderImage(0),
      location: locationName,
      date: event.start_date || "",
    };

    toggleFavorite(favoriteData);

    // STEP 2: Show toast ONLY when adding to favorites
    if (!wasFavorite) {
      toast("Event geplant ✨", { duration: 2000 });
    }

    // STEP 3: Update database favorite_count via API
    try {
      const numericId = parseInt(event.id, 10);
      if (!isNaN(numericId)) {
        const result = await toggleFavoriteApi(numericId);
        setRawEvents(prev => prev.map(e =>
          e.id === event.id
            ? { ...e, favorite_count: result.favoriteCount }
            : e
        ));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [toggleFavorite, isFavorited]);

  // Calculate subcategories for selected category
  const subCategories = useMemo(() => {
    if (!filters.categoryId) return [];
    return taxonomy
      .filter((t) => t.type === "sub" && t.parent_id === filters.categoryId)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [taxonomy, filters.categoryId]);

  // Filter handlers
  const handleCategoryChange = (categoryId: number | null, categorySlug: string | null) => {
    setFilters(prev => ({ ...prev, categoryId, category: categorySlug }));
    setSelectedSubcategoryId(null); // Reset subcategory when category changes
  };

  const handleMoodChange = (mood: string | null) => {
    setFilters(prev => ({ ...prev, mood }));
  };

  const handleCityChange = (city: string) => {
    setFilters(prev => ({ ...prev, city }));
  };

  const handleRadiusChange = (radius: number) => {
    setFilters(prev => ({ ...prev, radius }));
  };

  const handleTimeChange = (time: string | null) => {
    setFilters(prev => ({ ...prev, time }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, date }));
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  // Load taxonomy from Supabase - with sessionStorage cache
  useEffect(() => {
    const loadTaxonomy = async () => {
      // Check sessionStorage cache first
      const cached = sessionStorage.getItem("taxonomy_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5 min cache
            setTaxonomy(parsed.data);
            return;
          }
        } catch {}
      }

      try {
        const { data, error } = await externalSupabase
          .from("taxonomy")
          .select("id, slug, name, type, parent_id, display_order, is_active")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          console.error("Taxonomy load error:", error);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map((t: any) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            type: t.type as "main" | "sub",
            parent_id: t.parent_id,
            display_order: t.display_order,
            is_active: t.is_active,
          }));
          setTaxonomy(mapped);
          // Cache in sessionStorage
          sessionStorage.setItem("taxonomy_cache", JSON.stringify({ data: mapped, timestamp: Date.now() }));
        }
      } catch (err) {
        console.error("Taxonomy fetch error:", err);
      }
    };
    loadTaxonomy();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setDisplayedEventsCount(30);
  }, [filters]);

  // Filter events based on selected filters (client-side filtering)
  const filteredEvents = useMemo(() => {
    let result = [...rawEvents];

    // 0A. Similar Events Filter (Amazon-style) - OVERRIDE all other filters
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

    // 0B. Nearby Events Filter (Amazon-style) - OVERRIDE all other filters
    if (nearbyEventsFilter) {
      const sourceEvent = rawEvents.find(e => e.id === nearbyEventsFilter);
      if (sourceEvent && sourceEvent.latitude && sourceEvent.longitude) {
        const NEARBY_DISTANCE_KM = 10; // Within 10km
        result = result.filter(event => {
          if (event.id === nearbyEventsFilter) return false; // Exclude source event
          if (!event.latitude || !event.longitude) return false;
          const distance = calculateDistance(
            sourceEvent.latitude,
            sourceEvent.longitude,
            event.latitude,
            event.longitude
          );
          return distance <= NEARBY_DISTANCE_KM;
        });
        return result; // Return early, ignore other filters
      }
    }

    // 1. Category Filter
    if (filters.categoryId) {
      result = result.filter(event => event.category_main_id === filters.categoryId);
    }

    // 1B. Subcategory Filter
    if (selectedSubcategoryId) {
      result = result.filter(event => event.category_sub_id === selectedSubcategoryId);
    }

    // 2. City + Radius Filter
    if (filters.city && filters.city !== "") {
      const cityCoords = CITY_COORDINATES[filters.city.toLowerCase()];
      if (cityCoords) {
        result = result.filter(event => {
          if (!event.latitude || !event.longitude) return false;
          const distance = calculateDistance(
            cityCoords.lat,
            cityCoords.lng,
            event.latitude,
            event.longitude
          );
          return distance <= filters.radius;
        });
      }
    }

    // 3. Date Filter
    if (filters.date) {
      const selectedDate = new Date(filters.date);
      selectedDate.setHours(0, 0, 0, 0);

      result = result.filter(event => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === selectedDate.getTime();
      });
    }

    // 4. Time Filter (heute, diese-woche, dieses-wochenende, etc.)
    if (filters.time) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      result = result.filter(event => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);

        switch (filters.time) {
          case 'heute':
            return eventDate.getTime() === now.getTime();

          case 'diese-woche': {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= now && eventDate <= weekEnd;
          }

          case 'dieses-wochenende': {
            const dayOfWeek = now.getDay();
            const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
            const saturday = new Date(now);
            saturday.setDate(saturday.getDate() + daysUntilSaturday);
            const sunday = new Date(saturday);
            sunday.setDate(sunday.getDate() + 1);
            return (eventDate.getTime() === saturday.getTime()) ||
                   (eventDate.getTime() === sunday.getTime());
          }

          case 'naechste-woche': {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() + 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= weekStart && eventDate < weekEnd;
          }

          case 'dieser-monat': {
            return eventDate.getMonth() === now.getMonth() &&
                   eventDate.getFullYear() === now.getFullYear();
          }

          default:
            return true;
        }
      });
    }

    // 5. Search Query Filter (minimum 3 characters)
    if (filters.search && filters.search.length >= 3) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(event => {
        return (
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.short_description?.toLowerCase().includes(searchLower) ||
          event.venue_name?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          event.address_city?.toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [rawEvents, filters, similarEventsFilter, nearbyEventsFilter, selectedSubcategoryId]);

  // Pagination: Calculate displayed events based on current page
  const displayedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + displayedEventsCount;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage, displayedEventsCount, EVENTS_PER_PAGE]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const canLoadMore = displayedEventsCount < EVENTS_PER_PAGE &&
                      (currentPage - 1) * EVENTS_PER_PAGE + displayedEventsCount < filteredEvents.length;

  // Map Pin Click Handler - Auto-jump to correct page
  const handleMapPinClick = useCallback((eventId: string) => {
    const eventIndex = filteredEvents.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return;
    }

    // Calculate which page this event is on
    const targetPage = Math.floor(eventIndex / EVENTS_PER_PAGE) + 1;

    // Jump to page if different
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      setDisplayedEventsCount(30); // Reset to initial count

      // Wait for re-render, then scroll to event
      setTimeout(() => {
        const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      // Same page, just scroll to it
      const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [filteredEvents, currentPage, EVENTS_PER_PAGE]);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Navbar />

      {/* Full-width Filter Bar - beiger Hintergrund */}
      <div className="sticky top-16 z-40 bg-[#F5F0E8] border-b border-stone-200">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
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

      <main className="container mx-auto px-3 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-stone-900 font-sans">
            Eventliste 1
          </h1>
        </div>

        {/* Split Layout - Event-Karten 10% schmaler für mehr Platz rechts */}
        <div className="flex gap-8 items-start">
          {/* Left: Event List - 63% Breite (vorher 70%), 500px wenn Map groß (vorher 550px) */}
          <div
            className="flex-shrink-0 transition-all duration-300"
            style={{
              width: mapExpanded ? "calc(55% - 2rem)" : "63%",
              maxWidth: mapExpanded ? "none" : "100%",
            }}
          >
            {/* Event List Container */}
            <div className="space-y-3">
              {/* Subcategory Pills - Sticky Bar */}
              {filters.categoryId && subCategories.length > 0 && (
                <div className="sticky top-32 z-10 bg-[#F5F0E8] py-3 -mx-2 px-2 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    <button
                      onClick={() => setSelectedSubcategoryId(null)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        selectedSubcategoryId === null
                          ? "bg-stone-800 text-white shadow-md"
                          : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50",
                      )}
                    >
                      Alle
                    </button>
                    {subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategoryId(sub.id === selectedSubcategoryId ? null : sub.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                          selectedSubcategoryId === sub.id
                            ? "bg-stone-800 text-white shadow-md"
                            : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50",
                        )}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filter Badge */}
              {(similarEventsFilter || nearbyEventsFilter) && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {similarEventsFilter && (
                      <>
                        <Sparkles size={18} className="text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">
                          Ähnliche Events werden angezeigt
                        </span>
                      </>
                    )}
                    {nearbyEventsFilter && (
                      <>
                        <MapPin size={18} className="text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">
                          Events in der Nähe (innerhalb 10 km)
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSimilarEventsFilter(null);
                      setNearbyEventsFilter(null);
                    }}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                    title="Filter entfernen"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    Keine Events gefunden. Versuche andere Filter oder ändere den Kartenausschnitt.
                  </p>
                </div>
              ) : (
                <>
                  {displayedEvents.map((event, index) => (
                    <div
                      key={event.id}
                      data-event-id={event.id}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    >
                      <EventCard
                        event={event}
                        index={index}
                        isFavorited={isFavorited(event.id)}
                        onToggleFavorite={handleToggleFavorite}
                        isMapExpanded={mapExpanded}
                        onClick={(event) => navigate(`/event/${event.external_id || event.id}`)}
                        similarEventsFilter={similarEventsFilter}
                        setSimilarEventsFilter={setSimilarEventsFilter}
                        nearbyEventsFilter={nearbyEventsFilter}
                        setNearbyEventsFilter={setNearbyEventsFilter}
                        setCurrentPage={setCurrentPage}
                        setDisplayedEventsCount={setDisplayedEventsCount}
                      />
                    </div>
                  ))}

                  {/* Scroll Detection Sentinel - für auto-load beim Scrollen */}
                  {canLoadMore && (
                    <div
                      ref={(el) => {
                        if (!el) return;

                        const observer = new IntersectionObserver(
                          (entries) => {
                            if (entries[0].isIntersecting) {
                              setDisplayedEventsCount(prev =>
                                Math.min(prev + SCROLL_LOAD_INCREMENT, EVENTS_PER_PAGE)
                              );
                            }
                          },
                          { threshold: 0.1 }
                        );

                        observer.observe(el);

                        // Cleanup wird automatisch aufgerufen wenn component unmounts
                        // Aber wir können es nicht returnen weil React das nicht erwartet
                        // Stattdessen speichern wir den Observer auf dem Element
                        (el as any)._observer = observer;
                      }}
                      className="h-10 flex items-center justify-center"
                    >
                      <div className="text-sm text-gray-400">Lade mehr Events...</div>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {displayedEventsCount >= EVENTS_PER_PAGE && (hasNextPage || hasPreviousPage) && (
                    <div className="mt-8 mb-4 flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                      <button
                        onClick={() => {
                          if (hasPreviousPage) {
                            setCurrentPage(prev => prev - 1);
                            setDisplayedEventsCount(30);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        disabled={!hasPreviousPage}
                        className={cn(
                          "px-6 py-2.5 rounded-lg font-medium transition-all",
                          hasPreviousPage
                            ? "bg-stone-900 text-white hover:bg-stone-800"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        ← Vorherige Seite
                      </button>

                      <div className="text-sm font-medium text-gray-700">
                        Seite {currentPage} von {totalPages}
                        <span className="text-gray-500 ml-2">
                          ({filteredEvents.length} Events total)
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (hasNextPage) {
                            setCurrentPage(prev => prev + 1);
                            setDisplayedEventsCount(30);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        disabled={!hasNextPage}
                        className={cn(
                          "px-6 py-2.5 rounded-lg font-medium transition-all",
                          hasNextPage
                            ? "bg-stone-900 text-white hover:bg-stone-800"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        Nächste Seite →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Expandable Map + Chatbot - Breiter (34% statt 27%) */}
          <div
            className={cn(
              "flex-shrink-0 space-y-6 transition-all duration-300 sticky top-36",
              mapExpanded ? "w-[45%]" : "w-[34%] mr-4"
            )}
          >
            {/* Map Container - 15% mehr Höhe (340px statt 296px) */}
            <div
              className={cn(
                "relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 transition-all duration-300",
                mapExpanded
                  ? "h-[calc(100vh-200px)] w-full"
                  : "h-[340px] w-full"
              )}
            >
              {/* EventsMap Komponente - SIMPLE version without search button */}
              <EventsMap
                onEventsChange={handleMapEventsChange}
                onEventClick={(eventId) => handleMapPinClick(eventId)}
                isVisible={true}
                selectedEventIds={favoriteIds}
                hoveredEventId={hoveredEventId}
                showOnlyEliteAndFavorites={false}
                customControls={true}
              />

              {/* Toggle Button */}
              <button
                onClick={() => setMapExpanded(!mapExpanded)}
                className="absolute top-3 right-3 w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
              >
                {mapExpanded ? (
                  <Minimize2 size={18} className="text-gray-700" />
                ) : (
                  <Maximize2 size={18} className="text-gray-700" />
                )}
              </button>
            </div>

            {/* Miniatur Chatbot - klickbar, öffnet volle Version rechts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all h-[280px] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <h3 className="font-sans text-sm text-gray-900 font-semibold">
                  Dein Event-Assistent
                </h3>
              </div>

              {/* Messages - Mini mit mehr Abstand nach unten */}
              <div className="px-3 pb-5">
                <div className="flex justify-start">
                  <div className="max-w-[90%] px-2.5 py-1.5 rounded-xl text-xs bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100 leading-relaxed">
                    Hi! 👋 Verrate mir deinen Wunsch oder lass uns das Richtige über mein Quiz finden! ✨
                  </div>
                </div>
              </div>

              {/* Mission Buttons - Mini - 4 Pills in 2x2 Grid mit Interaktivität und mehr Abstand nach unten */}
              <div className="px-3 pb-5 grid grid-cols-2 gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>🧘</span>
                  <span>Solo</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>👨‍👩‍👧</span>
                  <span>Familie</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>🎉</span>
                  <span>Freunde</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>💕</span>
                  <span>Zu zweit</span>
                </button>
              </div>

              {/* Input Area - Mini mit Interaktivität */}
              <div className="px-3 pb-3">
                <div className="flex gap-1.5 items-end">
                  <input
                    type="text"
                    placeholder="Ich möchte diesen Samstag..."
                    className="flex-1 bg-white border-gray-200 rounded-lg text-[11px] px-2 py-1.5 text-gray-900"
                    onFocus={(e) => {
                      e.stopPropagation();
                      setChatbotOpen(true);
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatbotOpen(true);
                    }}
                    className="bg-[hsl(var(--wizard-accent))] hover:bg-[hsl(var(--wizard-accent))]/90 text-white rounded-lg px-2.5 py-1.5 text-[11px] transition-all"
                  >
                    ✨
                  </button>
                </div>
              </div>
            </div>

            {/* Volle ChatbotPopup - öffnet sich RECHTS */}
            <ChatbotPopupRight
              isOpen={chatbotOpen}
              onClose={() => setChatbotOpen(false)}
              onOpen={() => setChatbotOpen(true)}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventList1;
