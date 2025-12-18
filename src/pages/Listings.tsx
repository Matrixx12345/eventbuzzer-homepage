import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import {
  Heart,
  SlidersHorizontal,
  X,
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
  Check,
  Music,
  Palette,
  Sparkles,
  Flame,
  LayoutGrid,
  Zap,
  UtensilsCrossed,
  Gift,
  Snowflake,
  Sun,
  CalendarDays,
  Dog,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  format,
  addDays,
  addWeeks,
  isToday,
  isTomorrow,
  parseISO,
  isSameDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isAfter,
  isBefore,
} from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

// FIX: Wir nutzen hier explizit deinen externen Client für dein echtes Projekt
import { externalSupabase as supabase } from "@/integrations/supabase/external";

// Placeholder images for fallback
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import eventSymphony from "@/assets/event-symphony.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import swissBern from "@/assets/swiss-bern.jpg";
import swissLucerne from "@/assets/swiss-lucerne.jpg";
import swissGeneva from "@/assets/swiss-geneva.jpg";
import weekendJazz from "@/assets/weekend-jazz.jpg";
import weekendOpera from "@/assets/weekend-opera.jpg";
import festivalCrowd from "@/assets/festival-crowd.jpg";
import festivalSinger from "@/assets/festival-singer.jpg";
import festivalStage from "@/assets/festival-stage.jpg";
import festivalFriends from "@/assets/festival-friends.jpg";
import festivalChoir from "@/assets/festival-choir.jpg";

// Rotating placeholder images
const placeholderImages = [
  eventAbbey,
  eventVenue,
  eventConcert,
  eventSymphony,
  swissZurich,
  swissBern,
  swissLucerne,
  swissGeneva,
  weekendJazz,
  weekendOpera,
  festivalCrowd,
  festivalSinger,
  festivalStage,
  festivalFriends,
  festivalChoir,
];

const getPlaceholderImage = (index: number) => {
  return placeholderImages[index % placeholderImages.length];
};

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
  ticket_link?: string;
  category_main_id?: number;
  category_sub_id?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  available_months?: number[];
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

const quickFilters = [
  { id: "geburtstag", label: "Geburtstag", icon: Cake, tags: ["besondere-anlaesse", "freunde-gruppen"] },
  { id: "mistwetter", label: "Mistwetter", icon: CloudRain, tags: ["schlechtwetter-indoor"] },
  { id: "top-stars", label: "Top Stars", icon: Star, tags: ["vip-artists"] },
  { id: "foto-spots", label: "Foto-Spots", icon: Camera, tags: ["foto-spot"] },
  { id: "romantik", label: "Romantik", icon: HeartIcon, tags: ["romantisch-date"] },
  {
    id: "mit-kind",
    label: "Mit Kind",
    icon: Smile,
    tags: ["familie-kinder", "kleinkinder", "schulkinder", "teenager"],
  },
  {
    id: "nightlife",
    label: "Nightlife",
    icon: PartyPopper,
    tags: ["nightlife-party", "afterwork", "rooftop-aussicht"],
  },
  { id: "wellness", label: "Wellness", icon: Waves, tags: ["wellness-selfcare"] },
  { id: "natur", label: "Natur", icon: Mountain, tags: ["natur-erlebnisse", "open-air"] },
];

const cities = ["Zürich", "Bern", "Basel", "Luzern", "Genf", "Baden", "Winterthur", "St. Gallen"];

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [vipArtists, setVipArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarMode, setCalendarMode] = useState<"single" | "range">("single");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedPriceTier, setSelectedPriceTier] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamilyAgeFilter, setSelectedFamilyAgeFilter] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);
  const [dogFriendly, setDogFriendly] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const isWinterSeason = [11, 12, 1, 2, 3].includes(currentMonth);

  const availabilityFilters = [
    { id: "now", label: "Jetzt verfügbar", icon: Zap },
    { id: "winter", label: "Winter", icon: Snowflake },
    { id: "summer", label: "Sommer", icon: Sun },
    { id: "year-round", label: "Ganzjährig", icon: CalendarDays },
  ];

  const familyAgeFilters = [
    { id: "alle", label: "Alle Altersgruppen", tag: "familie-kinder" },
    { id: "kleinkinder", label: "Kleinkinder (0-4 J.)", tag: "kleinkinder" },
    { id: "schulkinder", label: "Schulkinder (5-10 J.)", tag: "schulkinder" },
    { id: "teenager", label: "Teenager (ab 11 J.)", tag: "teenager" },
  ];

  const [selectedIndoorFilter, setSelectedIndoorFilter] = useState<string | null>(null);
  const indoorFilters = [
    { id: "alles-indoor", label: "Alles bei Mistwetter", tags: ["schlechtwetter-indoor"] },
    { id: "mit-kindern", label: "Mit Kindern", tags: ["schlechtwetter-indoor", "familie-kinder"] },
  ];

  const isFamilyFilterActive = selectedQuickFilters.includes("mit-kind");
  const isMistwetterFilterActive = selectedQuickFilters.includes("mistwetter");

  const mainCategories = useMemo(
    () => taxonomy.filter((t) => t.type === "main").sort((a, b) => a.name.localeCompare(b.name)),
    [taxonomy],
  );

  const subCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return taxonomy
      .filter((t) => t.type === "sub" && t.parent_id === selectedCategoryId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [taxonomy, selectedCategoryId]);

  const timeFilters = [
    { id: "today", label: "Heute" },
    { id: "tomorrow", label: "Morgen" },
    { id: "thisWeek", label: "Wochenende" },
  ];

  const isTopStarsActive = selectedQuickFilters.includes("top-stars");

  const selectTimeFilter = (filterId: string) => {
    setSelectedTimeFilter((prev) => (prev === filterId ? null : filterId));
    setSelectedDateRange(undefined);
    setSelectedDate(undefined);
  };

  const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = useMemo(
    () => ({
      zürich: { lat: 47.3769, lng: 8.5417 },
      bern: { lat: 46.948, lng: 7.4474 },
      basel: { lat: 47.5596, lng: 7.5886 },
      luzern: { lat: 47.0502, lng: 8.3093 },
      genf: { lat: 46.2044, lng: 6.1432 },
      baden: { lat: 47.4734, lng: 8.3063 },
      winterthur: { lat: 47.4984, lng: 8.7246 },
      "st. gallen": { lat: 47.4245, lng: 9.3767 },
    }),
    [],
  );

  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};

    if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();
    if (selectedCategoryId !== null && !isTopStarsActive) filters.categoryId = selectedCategoryId;
    if (selectedSubcategoryId !== null && !isTopStarsActive) filters.subcategoryId = selectedSubcategoryId;
    if (selectedPriceTier) filters.priceTier = selectedPriceTier;
    if (selectedSource) filters.source = selectedSource;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedAvailability) filters.availability = selectedAvailability;

    if (selectedDate) filters.singleDate = selectedDate.toISOString();
    if (selectedDateRange?.from) filters.dateFrom = selectedDateRange.from.toISOString();
    if (selectedDateRange?.to) filters.dateTo = selectedDateRange.to.toISOString();

    if (selectedCity && !isTopStarsActive) {
      filters.city = selectedCity;
      if (radius[0] > 0) {
        filters.radius = radius[0];
        const cityKey = selectedCity.toLowerCase().trim();
        const coords = CITY_COORDINATES[cityKey];
        if (coords) {
          filters.cityLat = coords.lat;
          filters.cityLng = coords.lng;
        }
      }
    }

    const tags: string[] = [];
    if (selectedQuickFilters.includes("romantik")) tags.push("romantisch-date");
    if (selectedQuickFilters.includes("wellness")) tags.push("wellness-selfcare");
    if (selectedQuickFilters.includes("natur")) tags.push("natur-erlebnisse", "open-air");
    if (selectedQuickFilters.includes("foto-spots")) tags.push("foto-spot");
    if (selectedQuickFilters.includes("nightlife")) tags.push("nightlife-party", "afterwork", "rooftop-aussicht");
    if (selectedQuickFilters.includes("geburtstag")) tags.push("besondere-anlaesse", "freunde-gruppen");
    if (selectedQuickFilters.includes("mistwetter")) {
      const indoorFilter = indoorFilters.find((f) => f.id === selectedIndoorFilter) || indoorFilters[0];
      tags.push(...indoorFilter.tags);
    }
    if (selectedQuickFilters.includes("mit-kind")) {
      const ageTag =
        selectedFamilyAgeFilter === "alle" || !selectedFamilyAgeFilter ? "familie-kinder" : selectedFamilyAgeFilter;
      tags.push(ageTag);
    }
    if (tags.length > 0) filters.tags = tags;

    if (isTopStarsActive && vipArtists.length > 0) {
      filters.vipArtistsFilter = vipArtists;
    }

    return filters;
  }, [
    searchQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedPriceTier,
    selectedSource,
    selectedTimeFilter,
    selectedAvailability,
    selectedDate,
    selectedDateRange,
    selectedCity,
    radius,
    selectedQuickFilters,
    selectedFamilyAgeFilter,
    selectedIndoorFilter,
    isTopStarsActive,
    vipArtists,
    CITY_COORDINATES,
    indoorFilters,
  ]);

  const fetchEvents = useCallback(
    async (isInitial: boolean = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setEvents([]);
          setNextOffset(0);
        } else {
          setLoadingMore(true);
        }

        const offset = isInitial ? 0 : nextOffset;
        const filters = buildFilters();

        console.log("Fetching from EXTERNAL project with filters:", filters);

        // Wir rufen die Funktion über den echten Projekt-Client auf
        const { data, error: fetchError } = await supabase.functions.invoke("get-external-events", {
          body: {
            offset,
            limit: 30, // FIX: Stabiles Limit
            initialLoad: isInitial,
            filters,
          },
        });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data?.events) {
          if (isInitial) {
            setEvents(data.events);
          } else {
            setEvents((prev) => [...prev, ...data.events]);
          }
        }

        if (data?.pagination) {
          setHasMore(data.pagination.hasMore);
          setNextOffset(data.pagination.nextOffset || offset + 30);
          setTotalEvents(data.pagination.total);
        }

        if (isInitial) {
          if (data?.taxonomy) setTaxonomy(data.taxonomy);
          if (data?.vipArtists) setVipArtists(data.vipArtists);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [nextOffset, buildFilters],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvents(true);
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    selectedCity,
    radius,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedQuickFilters,
    selectedPriceTier,
    selectedTimeFilter,
    dogFriendly,
    selectedDate,
    selectedDateRange,
    selectedAvailability,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchEvents(false);
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, loading, fetchEvents]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setSelectedDateRange(range);
    if (!range || (range.from && range.to)) {
      setShowCalendar(false);
    }
  };

  const openSingleDateCalendar = () => {
    setCalendarMode("single");
    setShowCalendar(true);
  };

  const openRangeCalendar = () => {
    setCalendarMode("range");
    setShowCalendar(true);
  };

  const toggleQuickFilter = (filterId: string) => {
    const isCurrentlyActive = selectedQuickFilters.includes(filterId);

    if (isCurrentlyActive) {
      if (filterId === "mit-kind") setSelectedFamilyAgeFilter(null);
      if (filterId === "mistwetter") setSelectedIndoorFilter(null);
      setSelectedQuickFilters([]);
      return;
    }

    if (selectedQuickFilters.includes("mit-kind") && filterId !== "mit-kind") {
      setSelectedFamilyAgeFilter(null);
    }

    if (selectedQuickFilters.includes("mistwetter") && filterId !== "mistwetter") {
      setSelectedIndoorFilter(null);
    }

    if (filterId === "mit-kind") setSelectedFamilyAgeFilter("alle");
    if (filterId === "mistwetter") setSelectedIndoorFilter("alles-indoor");

    if (filterId === "top-stars") {
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
    }

    setSelectedQuickFilters([filterId]);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatEventDate = (
    dateString?: string,
    externalId?: string,
    dateRangeStart?: string,
    dateRangeEnd?: string,
    showCount?: number,
  ) => {
    if (!dateString) {
      const isMySwitzerland = externalId?.startsWith("mys_");
      return isMySwitzerland ? "Jederzeit" : "Datum TBA";
    }
    try {
      if (dateRangeStart && dateRangeEnd && showCount && showCount > 1) {
        const startDate = parseISO(dateRangeStart);
        const endDate = parseISO(dateRangeEnd);
        return `${format(startDate, "d. MMM", { locale: de })} – ${format(endDate, "d. MMM yyyy", { locale: de })} (${showCount} Shows)`;
      }
      const date = parseISO(dateString);
      return format(date, "d. MMM yyyy", { locale: de });
    } catch {
      return "Datum TBA";
    }
  };

  const findNearestCityFromCoords = (lat: number, lng: number): string | null => {
    const cities = [
      { name: "Zürich", lat: 47.3769, lng: 8.5417 },
      { name: "Bern", lat: 46.948, lng: 7.4474 },
      { name: "Basel", lat: 47.5596, lng: 7.5886 },
      { name: "Luzern", lat: 47.0502, lng: 8.3093 },
      { name: "Genf", lat: 46.2044, lng: 6.1432 },
      { name: "Lausanne", lat: 46.5197, lng: 6.6323 },
      { name: "St. Gallen", lat: 47.4245, lng: 9.3767 },
      { name: "Winterthur", lat: 47.4984, lng: 8.7246 },
      { name: "Lugano", lat: 46.0037, lng: 8.9511 },
      { name: "Chur", lat: 46.8509, lng: 9.532 },
    ];
    let nearestCity = null;
    let minDistance = Infinity;
    for (const city of cities) {
      const distance = calculateDistance(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city.name;
      }
    }
    return minDistance < 100 ? nearestCity : null;
  };

  const getEventLocation = (event: ExternalEvent) => {
    if (event.address_city && event.address_city.trim() && event.address_city !== "Schweiz") return event.address_city;
    if (event.venue_name && event.venue_name.trim() && event.venue_name !== event.title) return event.venue_name;
    if (event.location && event.location.trim() && event.location !== event.title && event.location !== "Schweiz")
      return event.location;
    if (event.latitude && event.longitude) {
      const nearestCity = findNearestCityFromCoords(event.latitude, event.longitude);
      if (nearestCity) return nearestCity;
    }
    return "Schweiz";
  };

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedDateRange(undefined);
    setSelectedTimeFilter(null);
    setSelectedQuickFilters([]);
    setSelectedPriceTier(null);
    setSelectedCity("");
    setRadius([0]);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedSource(null);
    setSearchQuery("");
    setSelectedFamilyAgeFilter(null);
    setSelectedIndoorFilter(null);
    setSelectedAvailability(null);
    setDogFriendly(false);
  };

  const hasActiveFilters =
    selectedDate !== undefined ||
    selectedDateRange !== undefined ||
    selectedTimeFilter !== null ||
    selectedQuickFilters.length > 0 ||
    selectedPriceTier !== null ||
    selectedCity !== "" ||
    radius[0] > 0 ||
    selectedCategoryId !== null ||
    selectedSubcategoryId !== null ||
    selectedSource !== null ||
    searchQuery.trim() !== "" ||
    selectedAvailability !== null ||
    dogFriendly;

  const filterContent = (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">WO / ORT</h3>
          {isTopStarsActive && (
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
              <Star size={12} className="fill-amber-400" />
              National
            </span>
          )}
        </div>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Stadt eingeben..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            list="cities"
            disabled={isTopStarsActive}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all border",
              isTopStarsActive
                ? "bg-neutral-800 text-gray-500 border-neutral-700 cursor-not-allowed"
                : "bg-white text-gray-800 border-gray-200",
            )}
          />
          <datalist id="cities">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("pt-1 px-1", isTopStarsActive && "opacity-50 cursor-not-allowed")}>
                <Slider
                  value={radius}
                  onValueChange={isTopStarsActive ? undefined : setRadius}
                  max={50}
                  step={5}
                  className="w-full"
                  disabled={isTopStarsActive}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs text-gray-400 font-medium">Umkreis</span>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums px-2 py-0.5 rounded-lg border",
                      isTopStarsActive
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-white text-gray-800 border-gray-200",
                    )}
                  >
                    {isTopStarsActive ? "∞" : `${radius[0]} km`}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            {isTopStarsActive && (
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-center">Schweizweit – Entfernung spielt keine Rolle bei Top Stars</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stimmung</h3>
        <TooltipProvider>
          {(() => {
            const rows: (typeof quickFilters)[] = [];
            for (let i = 0; i < quickFilters.length; i += 3) {
              rows.push(quickFilters.slice(i, i + 3));
            }
            const familyRowIndex = rows.findIndex((row) => row.some((f) => f.id === "mit-kind"));
            const mistwetterRowIndex = rows.findIndex((row) => row.some((f) => f.id === "mistwetter"));

            return (
              <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex}>
                    <div className="grid grid-cols-3 gap-1.5">
                      {row.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = selectedQuickFilters.includes(filter.id);
                        return (
                          <Tooltip key={filter.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => toggleQuickFilter(filter.id)}
                                className={cn(
                                  "aspect-[4/3] flex flex-col items-center justify-center rounded-xl transition-all p-1.5",
                                  isActive && filter.id === "top-stars"
                                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                                    : isActive
                                      ? "bg-blue-600 text-white shadow-md"
                                      : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200",
                                )}
                              >
                                <Icon size={18} strokeWidth={1.8} />
                                <span className="text-[13px] font-medium leading-tight mt-0.5">{filter.label}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{filter.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    {rowIndex === mistwetterRowIndex && isMistwetterFilterActive && (
                      <div className="mt-2 p-2.5 bg-neutral-800 rounded-xl border border-neutral-700">
                        <div className="flex flex-col gap-1.5">
                          {indoorFilters.map((indoorFilter) => {
                            const isIndoorActive = selectedIndoorFilter === indoorFilter.id;
                            return (
                              <button
                                key={indoorFilter.id}
                                onClick={() => setSelectedIndoorFilter(indoorFilter.id)}
                                className={cn(
                                  "w-full py-2 px-3 rounded-lg text-xs font-medium transition-all text-left",
                                  isIndoorActive
                                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                                    : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-200",
                                )}
                              >
                                {indoorFilter.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {rowIndex === familyRowIndex && isFamilyFilterActive && (
                      <div className="mt-2 p-2.5 bg-neutral-800 rounded-xl border border-neutral-700">
                        <div className="flex flex-col gap-1.5">
                          {familyAgeFilters.map((ageFilter) => {
                            const isAgeActive = selectedFamilyAgeFilter === ageFilter.id;
                            return (
                              <button
                                key={ageFilter.id}
                                onClick={() => setSelectedFamilyAgeFilter(ageFilter.id)}
                                className={cn(
                                  "w-full py-2 px-3 rounded-lg text-xs font-medium transition-all text-left",
                                  isAgeActive
                                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                                    : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-200",
                                )}
                              >
                                {ageFilter.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategorie</h3>
        <div className="space-y-2">
          {(() => {
            const allCategories = [
              { id: null, name: "Alle Kategorien", icon: LayoutGrid },
              ...mainCategories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                icon: cat.name.includes("Musik")
                  ? Music
                  : cat.name.includes("Kunst")
                    ? Palette
                    : cat.name.includes("Kulinarik") || cat.name.includes("Genuss")
                      ? UtensilsCrossed
                      : cat.name.includes("Freizeit")
                        ? Sparkles
                        : cat.name.includes("Märkte")
                          ? Gift
                          : LayoutGrid,
              })),
            ];
            const rows: (typeof allCategories)[] = [];
            for (let i = 0; i < allCategories.length; i += 2) {
              rows.push(allCategories.slice(i, i + 2));
            }
            return rows.map((row, rowIndex) => {
              const selectedInRow = row.find((cat) => selectedCategoryId === cat.id && cat.id !== null);
              const relevantSubs = selectedInRow ? subCategories : [];
              return (
                <div key={rowIndex}>
                  <div className="grid grid-cols-2 gap-2">
                    {row.map((cat) => {
                      const isActive = selectedCategoryId === cat.id;
                      const IconComponent = cat.icon;
                      return (
                        <button
                          key={cat.id ?? "all"}
                          onClick={() => {
                            if (cat.id === null || selectedCategoryId === cat.id) {
                              setSelectedCategoryId(null);
                              setSelectedSubcategoryId(null);
                            } else {
                              setSelectedCategoryId(cat.id);
                              setSelectedSubcategoryId(null);
                            }
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all",
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200",
                          )}
                        >
                          <IconComponent size={24} className="mb-2" />
                          <span className="text-[13px] font-medium text-center">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedInRow && relevantSubs.length > 0 && (
                    <div className="mt-2 bg-neutral-900 rounded-xl p-3 border border-neutral-700">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => setSelectedSubcategoryId(null)}
                          className={cn(
                            "w-full px-3 py-2 rounded-full text-[13px] font-medium transition-all text-left",
                            selectedSubcategoryId === null ? "bg-blue-600 text-white" : "bg-white text-gray-800",
                          )}
                        >
                          Alle
                        </button>
                        {relevantSubs.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubcategoryId(selectedSubcategoryId === sub.id ? null : sub.id)}
                            className={cn(
                              "w-full px-3 py-2 rounded-full text-[13px] font-medium transition-all text-left",
                              selectedSubcategoryId === sub.id ? "bg-blue-600 text-white" : "bg-white text-gray-800",
                            )}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Wann?</h3>
        <button
          onClick={() => selectTimeFilter("now")}
          className={cn(
            "w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
            selectedTimeFilter === "now"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
              : "bg-white text-gray-800 hover:bg-orange-50 border border-gray-200",
          )}
        >
          <Zap size={16} />
          ⚡️ JETZT
        </button>
        <div className="grid grid-cols-3 gap-1.5">
          {timeFilters.map((filter) => {
            const isActive = selectedTimeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => selectTimeFilter(filter.id)}
                className={cn(
                  "h-9 px-2 rounded-lg text-xs font-medium transition-all text-center",
                  isActive ? "bg-blue-600 text-white" : "bg-white text-gray-800 border border-gray-200",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={openRangeCalendar}
          className={cn(
            "w-full h-10 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
            selectedDateRange?.from ? "bg-blue-600 text-white" : "bg-white text-gray-800 border border-gray-200",
          )}
        >
          <CalendarIcon size={14} />
          <span>
            {selectedDateRange?.from
              ? selectedDateRange.to
                ? `${format(selectedDateRange.from, "d. MMM", { locale: de })} - ${format(selectedDateRange.to, "d. MMM", { locale: de })}`
                : format(selectedDateRange.from, "d. MMM yyyy", { locale: de })
              : "Zeitraum wählen"}
          </span>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: "gratis", label: "Gratis" },
            { id: "$", label: "$" },
            { id: "$$", label: "$$" },
            { id: "$$$", label: "$$$" },
          ].map((tier) => {
            const isActive = selectedPriceTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedPriceTier(isActive ? null : tier.id)}
                className={cn(
                  "h-10 px-2 rounded-xl text-xs font-semibold transition-all text-center",
                  isActive ? "bg-blue-600 text-white" : "bg-white text-gray-800 border border-gray-200",
                )}
              >
                {tier.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 px-1">
          <div className="flex items-center gap-2">
            <Dog size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Mit Hund erlaubt?</span>
          </div>
          <Switch checked={dogFriendly} onCheckedChange={setDogFriendly} />
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-neutral-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suche</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Künstler, Event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-800 border border-gray-200"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-all"
        >
          ✕ Filter zurücksetzen
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-[340px] flex-shrink-0 -mt-2">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl">{filterContent}</div>
            <div className="mt-4 px-2 text-xs text-neutral-500">
              {loading ? (
                "Lädt..."
              ) : (
                <>
                  <p>
                    {filteredEvents.length} von {totalEvents} Events
                  </p>
                </>
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2.5 px-5 py-3 bg-white shadow-sm rounded-full text-sm font-medium text-neutral-700"
              >
                <SlidersHorizontal size={16} />
                Filter {hasActiveFilters && `(${selectedQuickFilters.length})`}
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredEvents.map((event, index) => {
                  const eventImage = event.image_url || getPlaceholderImage(index);
                  return (
                    <Link key={event.id} to={`/event/${event.id}`} className="block group">
                      <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                        <div className="relative overflow-hidden">
                          <img src={eventImage} alt={event.title} className="w-full aspect-[5/6] object-cover" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const wasNotFavorite = !isFavorite(event.id);
                              toggleFavorite({
                                id: event.id,
                                slug: event.id,
                                title: event.title,
                                venue: event.venue_name || "",
                                location: getEventLocation(event),
                                image: eventImage,
                                date: formatEventDate(event.start_date, event.external_id),
                              });
                              if (wasNotFavorite) sendLike(event.id);
                            }}
                            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95"
                          >
                            <Heart
                              size={16}
                              className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                            />
                          </button>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-neutral-400">
                              {formatEventDate(
                                event.start_date,
                                event.external_id,
                                event.date_range_start,
                                event.date_range_end,
                                event.show_count,
                              )}
                            </p>
                            <EventRatingButtons eventId={event.id} eventTitle={event.title} />
                          </div>
                          <h3 className="font-serif text-lg text-neutral-900 line-clamp-1">{event.title}</h3>
                          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
                            <MapPin size={14} className="text-red-500" />
                            <span className="truncate">{getEventLocation(event)}</span>
                          </div>
                          {event.price_from && (
                            <p className="text-sm font-medium text-neutral-900 mt-2">ab CHF {event.price_from}</p>
                          )}
                          {event.short_description && (
                            <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{event.short_description}</p>
                          )}
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && !error && filteredEvents.length > 0 && (
              <div ref={loadMoreRef} className="py-10 flex flex-col items-center">
                {loadingMore ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Alle Events geladen</span>}
              </div>
            )}
          </main>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 max-h-[90vh] overflow-y-auto">
            {filterContent}
          </div>
        </div>
      )}

      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-md bg-white">
          <div className="flex justify-center py-4">
            {calendarMode === "single" ? (
              <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={de} />
            ) : (
              <Calendar mode="range" selected={selectedDateRange} onSelect={handleDateRangeSelect} locale={de} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Listings;
