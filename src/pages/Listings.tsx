import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import {
  Heart,
  MapPin,
  Calendar as CalendarIcon,
  Cake,
  CloudRain,
  Star,
  Camera,
  Heart as HeartIcon,
  Smile,
  PartyPopper,
  Waves,
  Mountain,
  Search,
  Loader2,
  Music,
  Palette,
  Sparkles,
  LayoutGrid,
  Zap,
  UtensilsCrossed,
  Gift,
  Dog,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";

// Assets
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

interface ExternalEvent {
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
  price_label?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  date_range_start?: string;
  date_range_end?: string;
  show_count?: number;
}

interface TaxonomyItem {
  id: number;
  name: string;
  type: "main" | "sub";
  parent_id: number | null;
}

// DEIN EXAKTER FILTER-AUFBAU (Mood-Tabelle Keywords)
const quickFilters = [
  {
    id: "geburtstag",
    label: "Geburtstag",
    icon: Cake,
    keywords: ["Geburtstag", "Party", "Feier", "Jubiläum", "B-Day", "VIP", "Sekt"],
  },
  {
    id: "mistwetter",
    label: "Mistwetter",
    icon: CloudRain,
    keywords: ["Indoor", "Überdacht", "Halle", "Saal", "Museum", "Ausstellung", "Kino", "Theater", "Drinnen"],
  },
  { id: "top-stars", label: "Top Stars", icon: Star, keywords: ["Star", "VIP", "Headliner", "Top"] },
  {
    id: "foto-spots",
    label: "Foto-Spots",
    icon: Camera,
    keywords: ["Instagram", "Insta", "Selfie", "Foto", "Aussicht", "Skyline", "Kulisse"],
  },
  {
    id: "romantik",
    label: "Romantik",
    icon: HeartIcon,
    keywords: ["Romantisch", "Date", "Candle", "Dinner", "Liebe", "Pärchen", "Couple", "Sunset"],
  },
  {
    id: "mit-kind",
    label: "Mit Kind",
    icon: Smile,
    keywords: ["Kind", "Familie", "Family", "Märchen", "Zirkus", "Spiel", "Ferien"],
  },
  {
    id: "nightlife",
    label: "Nightlife",
    icon: PartyPopper,
    keywords: ["Club", "DJ", "Tanz", "Nachtleben", "Bar", "Drinks", "18+", "Techno"],
  },
  {
    id: "wellness",
    label: "Wellness",
    icon: Waves,
    keywords: ["Wellness", "Spa", "Sauna", "Massage", "Yoga", "Entspannung", "Therme"],
  },
  {
    id: "natur",
    label: "Natur",
    icon: Mountain,
    keywords: ["Outdoor", "Draußen", "Wandern", "Wald", "See", "Garten", "Natur"],
  },
];

const cities = ["Zürich", "Bern", "Basel", "Luzern", "Genf", "Baden", "Winterthur", "St. Gallen"];

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null);
  const [selectedPriceTier, setSelectedPriceTier] = useState<string | null>(null);
  const [dogFriendly, setDogFriendly] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);

  // FIX: KEIN TBA MEHR - Immer Range oder Datum
  const formatEventDate = (d?: string, ext?: string, start?: string, end?: string, count?: number) => {
    if (start && end) {
      try {
        const s = format(parseISO(start), "d. MMM", { locale: de });
        const e = format(parseISO(end), "d. MMM yyyy", { locale: de });
        return `${s} – ${e}${count && count > 1 ? ` (${count} Shows)` : ""}`;
      } catch {
        /* fallthrough */
      }
    }
    if (d) {
      try {
        return format(parseISO(d), "d. MMM yyyy", { locale: de });
      } catch {
        /* fallthrough */
      }
    }
    return ext?.startsWith("mys_") ? "Jederzeit" : "Datum folgt";
  };

  const getEventLocation = (event: ExternalEvent) => {
    const city = event.address_city?.trim();
    if (city && city !== "Schweiz" && !event.title.toLowerCase().includes(city.toLowerCase())) return city;
    return event.venue_name || event.location || "Schweiz";
  };

  const getDistanceInfo = (lat: number, lng: number) => {
    const centers = [
      { name: "Zürich", lat: 47.3769, lng: 8.5417 },
      { name: "Bern", lat: 46.948, lng: 7.4474 },
      { name: "Basel", lat: 47.5596, lng: 7.5886 },
    ];
    let nearest = centers[0],
      minDist = Infinity;
    centers.forEach((c) => {
      const d = Math.sqrt(Math.pow((lat - c.lat) * 111, 2) + Math.pow((lng - c.lng) * 85, 2));
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    });
    return `~${Math.round(minDist)} km von ${nearest.name}`;
  };

  const fetchEvents = useCallback(
    async (isInitial: boolean = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setEvents([]);
          setNextOffset(0);
        } else setLoadingMore(true);

        const { data, error: fetchError } = await supabase.functions.invoke("get-external-events", {
          body: {
            offset: isInitial ? 0 : nextOffset,
            limit: 30,
            filters: {
              searchQuery,
              city: selectedCity,
              categoryId: selectedCategoryId,
              tags: selectedQuickFilters.flatMap((id) => quickFilters.find((f) => f.id === id)?.keywords || []),
            },
          },
        });

        if (fetchError) throw fetchError;
        if (data?.events) setEvents((prev) => (isInitial ? data.events : [...prev, ...data.events]));
        if (data?.pagination) {
          setHasMore(data.pagination.hasMore);
          setNextOffset(data.pagination.nextOffset);
          setTotalEvents(data.pagination.total);
        }
        if (isInitial && data?.taxonomy) setTaxonomy(data.taxonomy);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [nextOffset, searchQuery, selectedCity, selectedCategoryId, selectedQuickFilters],
  );

  useEffect(() => {
    fetchEvents(true);
  }, [searchQuery, selectedCity, selectedCategoryId, selectedQuickFilters]);

  const filterContent = (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Ort</h3>
        <input
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          placeholder="Stadt..."
          className="w-full p-2.5 rounded-xl border text-sm"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Stimmung</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {quickFilters.map((f) => {
            const Icon = f.icon;
            const active = selectedQuickFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => setSelectedQuickFilters(active ? [] : [f.id])}
                className={cn(
                  "aspect-[4/3] flex flex-col items-center justify-center rounded-xl border text-[11px] font-medium",
                  active ? "bg-blue-600 text-white" : "bg-white",
                )}
              >
                <Icon size={18} className="mb-1" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => {
          setSelectedCity("");
          setSelectedQuickFilters([]);
          setSearchQuery("");
        }}
        className="w-full py-2 text-xs text-gray-400"
      >
        ✕ Filter zurücksetzen
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-[320px] shrink-0">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl text-white">{filterContent}</div>
            <div className="mt-4 text-xs text-neutral-500">{loading ? "Lädt..." : `${events.length} Events`}</div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <Link key={event.id} to={`/event/${event.id}`} className="group">
                    <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                      <div className="relative aspect-[5/6]">
                        <img
                          src={event.image_url || getPlaceholderImage(index)}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite({ id: event.id, title: event.title, image: event.image_url || "" });
                          }}
                          className="absolute top-3 right-3 p-2 bg-white rounded-full"
                        >
                          <Heart
                            size={16}
                            className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-gray-400"}
                          />
                        </button>
                      </div>
                      <div className="p-5">
                        <p className="text-xs text-gray-400 mb-1">
                          {formatEventDate(
                            event.start_date,
                            event.external_id,
                            event.date_range_start,
                            event.date_range_end,
                            event.show_count,
                          )}
                        </p>
                        <h3 className="font-serif text-lg mb-2 line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin size={14} className="text-red-500" />
                          <span>{getEventLocation(event)}</span>
                          {event.latitude && (
                            <span className="text-xs text-gray-400">
                              • {getDistanceInfo(event.latitude, event.longitude)}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Listings;
