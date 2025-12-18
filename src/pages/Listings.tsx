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
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

// DIREKT-VERBINDUNG zu deinem Projekt
import { createClient } from "@supabase/supabase-js";
const EXTERNAL_URL = "https://tfkiyvhfhvkejpljsnrk.supabase.co";
const EXTERNAL_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs";
const supabase = createClient(EXTERNAL_URL, EXTERNAL_KEY);

// Placeholder images
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
  available_months?: number[];
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null);
  const [selectedPriceTier, setSelectedPriceTier] = useState<string | null>(null);
  const [dogFriendly, setDogFriendly] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarMode, setCalendarMode] = useState<"single" | "range">("single");
  const [selectedFamilyAgeFilter, setSelectedFamilyAgeFilter] = useState<string | null>(null);
  const [selectedIndoorFilter, setSelectedIndoorFilter] = useState<string | null>(null);

  const indoorFilters = [
    { id: "alles-indoor", label: "Alles bei Mistwetter", tags: ["schlechtwetter-indoor"] },
    { id: "mit-kindern", label: "Mit Kindern", tags: ["schlechtwetter-indoor", "familie-kinder"] },
  ];
  const familyAgeFilters = [
    { id: "alle", label: "Alle Altersgruppen", tag: "familie-kinder" },
    { id: "kleinkinder", label: "Kleinkinder (0-4 J.)", tag: "kleinkinder" },
    { id: "schulkinder", label: "Schulkinder (5-10 J.)", tag: "schulkinder" },
    { id: "teenager", label: "Teenager (ab 11 J.)", tag: "teenager" },
  ];

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
    if (selectedCategoryId !== null) filters.categoryId = selectedCategoryId;
    if (selectedSubcategoryId !== null) filters.subcategoryId = selectedSubcategoryId;
    if (selectedPriceTier) filters.priceTier = selectedPriceTier;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedDate) filters.singleDate = selectedDate.toISOString();
    if (selectedDateRange?.from) filters.dateFrom = selectedDateRange.from.toISOString();
    if (selectedDateRange?.to) filters.dateTo = selectedDateRange.to.toISOString();

    if (selectedCity) {
      filters.city = selectedCity;
      if (radius[0] > 0) {
        filters.radius = radius[0];
        const coords = CITY_COORDINATES[selectedCity.toLowerCase().trim()];
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
      const indoor = indoorFilters.find((f) => f.id === selectedIndoorFilter) || indoorFilters[0];
      tags.push(...indoor.tags);
    }
    if (selectedQuickFilters.includes("mit-kind")) {
      tags.push(
        selectedFamilyAgeFilter === "alle" || !selectedFamilyAgeFilter ? "familie-kinder" : selectedFamilyAgeFilter,
      );
    }
    if (tags.length > 0) filters.tags = tags;
    return filters;
  }, [
    searchQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedPriceTier,
    selectedTimeFilter,
    selectedCity,
    radius,
    selectedQuickFilters,
    selectedDate,
    selectedDateRange,
    selectedIndoorFilter,
    selectedFamilyAgeFilter,
    CITY_COORDINATES,
  ]);

  const fetchEvents = useCallback(
    async (isInitial: boolean = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setEvents([]);
          setNextOffset(0);
        } else setLoadingMore(true);
        const offset = isInitial ? 0 : nextOffset;
        const { data, error } = await supabase.functions.invoke("get-external-events", {
          body: { offset, limit: 30, initialLoad: isInitial, filters: buildFilters() },
        });
        if (error) throw error;
        if (data?.events) setEvents((prev) => (isInitial ? data.events : [...prev, ...data.events]));
        if (data?.pagination) {
          setHasMore(data.pagination.hasMore);
          setNextOffset(data.pagination.nextOffset || offset + 30);
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
    [nextOffset, buildFilters],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchEvents(true), 400);
    return () => clearTimeout(t);
  }, [
    searchQuery,
    selectedCity,
    radius,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedQuickFilters,
    selectedPriceTier,
    selectedTimeFilter,
    selectedDate,
    selectedDateRange,
    dogFriendly,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchEvents(false);
      },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchEvents]);

  const toggleQuickFilter = (filterId: string) => {
    const active = selectedQuickFilters.includes(filterId);
    if (active) {
      if (filterId === "mit-kind") setSelectedFamilyAgeFilter(null);
      if (filterId === "mistwetter") setSelectedIndoorFilter(null);
      setSelectedQuickFilters([]);
    } else {
      if (filterId === "mit-kind") setSelectedFamilyAgeFilter("alle");
      if (filterId === "mistwetter") setSelectedIndoorFilter("alles-indoor");
      setSelectedQuickFilters([filterId]);
    }
  };

  const getEventLocation = (event: ExternalEvent) =>
    event.address_city || event.venue_name || event.location || "Schweiz";
  const formatEventDate = (d?: string, ext?: string, start?: string, end?: string, count?: number) => {
    if (!d) return ext?.startsWith("mys_") ? "Jederzeit" : "Datum TBA";
    try {
      if (start && end && count && count > 1) {
        return `${format(parseISO(start), "d. MMM", { locale: de })} – ${format(parseISO(end), "d. MMM yyyy", { locale: de })} (${count} Shows)`;
      }
      return format(parseISO(d), "d. MMM yyyy", { locale: de });
    } catch {
      return "Datum TBA";
    }
  };

  const clearFilters = () => {
    setSelectedCity("");
    setRadius([0]);
    setSelectedQuickFilters([]);
    setSearchQuery("");
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedTimeFilter(null);
    setSelectedPriceTier(null);
    setDogFriendly(false);
    setSelectedDate(undefined);
    setSelectedDateRange(undefined);
  };

  const hasActiveFilters =
    selectedCity !== "" ||
    radius[0] > 0 ||
    selectedQuickFilters.length > 0 ||
    searchQuery.trim() !== "" ||
    selectedCategoryId !== null ||
    selectedTimeFilter !== null ||
    selectedPriceTier !== null ||
    dogFriendly;

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

  const filterContent = (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">WO / ORT</h3>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Stadt eingeben..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            list="cities"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-white"
          />
          <datalist id="cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="pt-1 px-1">
          <Slider value={radius} onValueChange={setRadius} max={50} step={5} className="w-full" />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-xs text-gray-400 font-medium">Umkreis</span>
            <span className="text-sm font-semibold tabular-nums border px-2 py-0.5 rounded-lg bg-white">
              {radius[0]} km
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stimmung</h3>
        <div className="space-y-2">
          {(() => {
            const rows = [];
            for (let i = 0; i < quickFilters.length; i += 3) rows.push(quickFilters.slice(i, i + 3));
            return rows.map((row, rIdx) => (
              <div key={rIdx}>
                <div className="grid grid-cols-3 gap-1.5">
                  {row.map((f) => {
                    const Icon = f.icon;
                    const active = selectedQuickFilters.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleQuickFilter(f.id)}
                        className={cn(
                          "aspect-[4/3] flex flex-col items-center justify-center rounded-xl transition-all p-1.5 border",
                          active ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-800",
                        )}
                      >
                        <Icon size={18} />
                        <span className="text-[13px] font-medium leading-tight mt-0.5">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
                {row.some((f) => f.id === "mistwetter") && selectedQuickFilters.includes("mistwetter") && (
                  <div className="mt-2 p-2.5 bg-neutral-800 rounded-xl border border-neutral-700 space-y-1.5">
                    {indoorFilters.map((ifilt) => (
                      <button
                        key={ifilt.id}
                        onClick={() => setSelectedIndoorFilter(ifilt.id)}
                        className={cn(
                          "w-full py-2 px-3 rounded-lg text-xs text-left",
                          selectedIndoorFilter === ifilt.id ? "bg-blue-600 text-white" : "bg-white text-gray-800",
                        )}
                      >
                        {ifilt.label}
                      </button>
                    ))}
                  </div>
                )}
                {row.some((f) => f.id === "mit-kind") && selectedQuickFilters.includes("mit-kind") && (
                  <div className="mt-2 p-2.5 bg-neutral-800 rounded-xl border border-neutral-700 space-y-1.5">
                    {familyAgeFilters.map((afilt) => (
                      <button
                        key={afilt.id}
                        onClick={() => setSelectedFamilyAgeFilter(afilt.id)}
                        className={cn(
                          "w-full py-2 px-3 rounded-lg text-xs text-left",
                          selectedFamilyAgeFilter === afilt.id ? "bg-pink-600 text-white" : "bg-white text-gray-800",
                        )}
                      >
                        {afilt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategorie</h3>
        <div className="space-y-2">
          {(() => {
            const allCats = [
              { id: null, name: "Alle", icon: LayoutGrid },
              ...mainCategories.map((c) => ({
                id: c.id,
                name: c.name,
                icon: c.name.includes("Musik")
                  ? Music
                  : c.name.includes("Kunst")
                    ? Palette
                    : c.name.includes("Kulinarik")
                      ? UtensilsCrossed
                      : LayoutGrid,
              })),
            ];
            const rows = [];
            for (let i = 0; i < allCats.length; i += 2) rows.push(allCats.slice(i, i + 2));
            return rows.map((row, rIdx) => {
              const selectedInRow = row.find((c) => selectedCategoryId === c.id && c.id !== null);
              return (
                <div key={rIdx}>
                  <div className="grid grid-cols-2 gap-2">
                    {row.map((cat) => (
                      <button
                        key={cat.id ?? "all"}
                        onClick={() => {
                          setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id);
                          setSelectedSubcategoryId(null);
                        }}
                        className={cn(
                          "flex flex-col items-center py-4 rounded-xl border transition-all",
                          selectedCategoryId === cat.id ? "bg-blue-600 text-white" : "bg-white text-gray-800",
                        )}
                      >
                        <cat.icon size={24} className="mb-2" />
                        <span className="text-[13px] font-medium">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedInRow && subCategories.length > 0 && (
                    <div className="mt-2 bg-neutral-900 rounded-xl p-3 border border-neutral-700 flex flex-col gap-1.5">
                      <button
                        onClick={() => setSelectedSubcategoryId(null)}
                        className={cn(
                          "w-full px-3 py-2 rounded-full text-xs text-left",
                          selectedSubcategoryId === null ? "bg-blue-600 text-white" : "text-gray-300",
                        )}
                      >
                        Alle
                      </button>
                      {subCategories.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSubcategoryId(s.id === selectedSubcategoryId ? null : s.id)}
                          className={cn(
                            "w-full px-3 py-2 rounded-full text-xs text-left",
                            selectedSubcategoryId === s.id ? "bg-blue-600 text-white" : "text-gray-300",
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
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
          onClick={() => setSelectedTimeFilter("now")}
          className={cn(
            "w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
            selectedTimeFilter === "now"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
              : "bg-white border text-gray-800",
          )}
        >
          <Zap size={16} />
          ⚡️ JETZT
        </button>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "today", label: "Heute" },
            { id: "tomorrow", label: "Morgen" },
            { id: "thisWeek", label: "WE" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTimeFilter((prev) => (prev === t.id ? null : t.id))}
              className={cn(
                "h-9 rounded-lg text-xs border",
                selectedTimeFilter === t.id ? "bg-blue-600 text-white" : "bg-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setCalendarMode("range");
            setShowCalendar(true);
          }}
          className={cn(
            "w-full h-10 rounded-xl text-sm border flex items-center justify-center gap-2",
            selectedDateRange?.from ? "bg-blue-600 text-white" : "bg-white",
          )}
        >
          <CalendarIcon size={14} />
          <span>Zeitraum wählen</span>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {["gratis", "$", "$$", "$$$"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriceTier((prev) => (prev === p ? null : p))}
              className={cn(
                "h-10 rounded-xl text-xs font-bold border",
                selectedPriceTier === p ? "bg-blue-600 text-white" : "bg-white",
              )}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-t border-neutral-700">
        <div className="flex items-center gap-2">
          <Dog size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Mit Hund?</span>
        </div>
        <Switch checked={dogFriendly} onCheckedChange={setDogFriendly} />
      </div>

      <div className="space-y-3 pt-3 border-t border-neutral-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Suche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600">
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
          <aside className="hidden lg:block w-[340px] flex-shrink-0">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl">{filterContent}</div>
            <p className="mt-4 px-2 text-xs text-neutral-500">
              {loading ? "Lädt..." : `${events.length} von ${totalEvents} Events`}
            </p>
          </aside>

          <main className="flex-1 min-w-0">
            {loading && !loadingMore ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {events.map((event, index) => (
                  <Link key={event.id} to={`/event/${event.id}`} className="block group">
                    <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                      <div className="relative overflow-hidden">
                        <img
                          src={event.image_url || getPlaceholderImage(index)}
                          alt={event.title}
                          className="w-full aspect-[5/6] object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite({
                              id: event.id,
                              slug: event.id,
                              title: event.title,
                              venue: event.venue_name || "",
                              image: event.image_url || getPlaceholderImage(index),
                              location: getEventLocation(event),
                              date: formatEventDate(event.start_date),
                            });
                          }}
                          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 shadow-sm"
                        >
                          <Heart
                            size={16}
                            className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                          />
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-neutral-400 font-medium">
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
                        <div className="group/map relative mt-1.5 cursor-help">
                          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                            <MapPin size={14} className="text-red-500 flex-shrink-0" />
                            <span className="truncate">{getEventLocation(event)}</span>
                            {event.latitude && (
                              <span className="text-neutral-400 text-xs whitespace-nowrap">• Karte</span>
                            )}
                          </div>
                          {event.latitude && event.longitude && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                              <div className="bg-white p-3 rounded-xl shadow-2xl border w-48 h-40">
                                <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                                  <img src="/swiss-outline.svg" className="w-full h-full object-contain" />
                                  <div
                                    className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg"
                                    style={{
                                      left: `${6 + ((event.longitude - 5.85) / 4.7) * 88}%`,
                                      top: `${3 + (1 - (event.latitude - 45.75) / 2.1) * 94}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
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
                ))}
              </div>
            )}
            <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl">
          <div className="flex justify-center py-4">
            <Calendar
              mode={calendarMode as any}
              selected={calendarMode === "single" ? selectedDate : (selectedDateRange as any)}
              onSelect={
                calendarMode === "single"
                  ? (d: any) => {
                      setSelectedDate(d);
                      setShowCalendar(false);
                    }
                  : (r: any) => {
                      setSelectedDateRange(r);
                      if (r?.from && r?.to) setShowCalendar(false);
                    }
              }
              locale={de}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Listings;
