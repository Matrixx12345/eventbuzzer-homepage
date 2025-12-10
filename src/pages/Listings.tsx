import { useState, useEffect, useMemo } from "react";
import { 
  Heart, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Calendar as CalendarIcon, 
  Cake, 
  CloudRain, 
  UtensilsCrossed,
  Camera,
  Heart as HeartIcon,
  Smile,
  PartyPopper,
  Waves,
  Mountain,
  Search,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, addDays, addWeeks, isToday, isTomorrow, parseISO, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

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
  category_main_id?: string;
  category_sub_id?: string;
  latitude?: number;
  longitude?: number;
}

// Quick filters with icons
const quickFilters = [
  { id: "geburtstag", label: "Geburtstag", icon: Cake },
  { id: "mistwetter", label: "Mistwetter", icon: CloudRain },
  { id: "streetfood", label: "Streetfood", icon: UtensilsCrossed },
  { id: "foto-spots", label: "Foto-Spots", icon: Camera },
  { id: "romantik", label: "Romantik", icon: HeartIcon },
  { id: "mit-kind", label: "Mit Kind", icon: Smile },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper },
  { id: "wellness", label: "Wellness", icon: Waves },
  { id: "natur", label: "Natur", icon: Mountain },
];

// Price filter removed - using simple toggle for free events only

const cities = ["Zürich", "Bern", "Basel", "Luzern", "Genf", "Baden", "Winterthur", "St. Gallen"];

const categories = [
  { value: "all", label: "Alle Kategorien" },
  { value: "musik", label: "Musik" },
  { value: "kultur", label: "Kultur" },
  { value: "festival", label: "Festival" },
  { value: "nightlife", label: "Nightlife" },
  { value: "sport", label: "Sport" },
  { value: "kulinarik", label: "Kulinarik" },
];

const subcategories: Record<string, string[]> = {
  all: ["Festival", "Konzert", "Klassik", "Jazz", "Oper", "Markt", "Gala", "Foto-Spots"],
  musik: ["Konzert", "Klassik", "Jazz", "Rock", "Pop", "Electronic"],
  kultur: ["Oper", "Theater", "Museum", "Ausstellung", "Foto-Spots"],
  festival: ["Festival", "Markt", "Messe"],
  nightlife: ["Club", "Bar", "Gala", "Party"],
  sport: ["Fussball", "Hockey", "Tennis", "Laufen"],
  kulinarik: ["Restaurant", "Streetfood", "Weinprobe", "Kochkurs"],
};

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Events state
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedPriceTier, setSelectedPriceTier] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  // Time filter definitions
  const timeFilters = [
    { id: "today", label: "Heute" },
    { id: "tomorrow", label: "Morgen" },
    { id: "thisWeek", label: "Diese Woche" },
    { id: "nextWeek", label: "Nächste Woche" },
    { id: "thisMonth", label: "Dieser Monat" },
  ];

  const selectTimeFilter = (filterId: string) => {
    // Single select - toggle off if already selected, otherwise select new one
    setSelectedTimeFilter((prev) => prev === filterId ? null : filterId);
    // Clear specific date when using time filters
    setSelectedDate(undefined);
  };

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase.functions.invoke('get-external-events', {
          body: { limit: 200 }
        });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data?.events) {
          setEvents(data.events);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const toggleQuickFilter = (filterId: string) => {
    setSelectedQuickFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  };

  const toggleSubcategory = (sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub)
        ? prev.filter((s) => s !== sub)
        : [...prev, sub]
    );
  };

  // Romantic keywords for filtering (same as backend)
  const ROMANTIC_KEYWORDS = [
    "romantisch", "romantic", "date", "liebe", "love", "candlelight", "kerzenlicht",
    "kerzenschein", "dinner", "gala", "piano", "klavier", "ballett", "ballet",
    "valentinstag", "valentine", "champagner", "champagne", "sunset", "sonnenuntergang",
    "couples", "paare", "jazz", "soul", "acoustic", "oper", "opera", "klassik", "classical"
  ];

  // Check if event matches romantic criteria
  const isRomanticEvent = (event: ExternalEvent) => {
    const textToCheck = [
      event.title,
      event.short_description,
      event.venue_name,
    ].filter(Boolean).join(" ").toLowerCase();
    
    return ROMANTIC_KEYWORDS.some(keyword => textToCheck.includes(keyword));
  };

  // City coordinates for radius filter
  const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = useMemo(() => ({
    "zürich": { lat: 47.3769, lng: 8.5417 },
    "bern": { lat: 46.9480, lng: 7.4474 },
    "basel": { lat: 47.5596, lng: 7.5886 },
    "luzern": { lat: 47.0502, lng: 8.3093 },
    "genf": { lat: 46.2044, lng: 6.1432 },
    "baden": { lat: 47.4734, lng: 8.3063 },
    "winterthur": { lat: 47.4984, lng: 8.7246 },
    "st. gallen": { lat: 47.4245, lng: 9.3767 },
  }), []);

  // Find city coordinates (case-insensitive, partial match)
  const findCityCoords = (cityName: string) => {
    const normalized = cityName.toLowerCase().trim();
    // Direct match first
    if (CITY_COORDINATES[normalized]) return CITY_COORDINATES[normalized];
    // Partial match
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (normalized.includes(key) || key.includes(normalized)) return coords;
    }
    return null;
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    // Strict price tier filter based on price_from AND price_label
    if (selectedPriceTier) {
      const price = event.price_from;
      const priceLabel = event.price_label || "";
      
      if (selectedPriceTier === "gratis") {
        // Gratis: ONLY price_from === 0 OR has budget tag
        // Explicitly exclude NULL price_from (unless has tag)
        const hasPrice = price !== null && price !== undefined;
        const isFree = hasPrice && price === 0;
        const hasBudgetTag = priceLabel.toLowerCase().includes("kostenlos") || priceLabel.toLowerCase().includes("gratis");
        if (!isFree && !hasBudgetTag) return false;
      } else if (selectedPriceTier === "$") {
        // Budget: price_from > 0 AND <= 50 OR price_label is exactly "$"
        const hasValidPrice = price !== null && price !== undefined && price > 0 && price <= 50;
        const hasMatchingLabel = priceLabel === "$";
        if (!hasValidPrice && !hasMatchingLabel) return false;
      } else if (selectedPriceTier === "$$") {
        // Standard: price_from > 50 AND <= 120 OR price_label is exactly "$$"
        const hasValidPrice = price !== null && price !== undefined && price > 50 && price <= 120;
        const hasMatchingLabel = priceLabel === "$$";
        if (!hasValidPrice && !hasMatchingLabel) return false;
      } else if (selectedPriceTier === "$$$") {
        // Premium: price_from > 120 OR price_label is exactly "$$$"
        const hasValidPrice = price !== null && price !== undefined && price > 120;
        const hasMatchingLabel = priceLabel === "$$$";
        if (!hasValidPrice && !hasMatchingLabel) return false;
      }
    }
    
    // City filter (text-based)
    if (selectedCity && radius[0] === 0) {
      const eventCity = event.address_city || event.location || "";
      if (!eventCity.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    }
    
    // Radius filter (geo-based) - only if city is selected AND radius > 0
    if (selectedCity && radius[0] > 0) {
      const cityCoords = findCityCoords(selectedCity);
      if (cityCoords && event.latitude && event.longitude) {
        const distance = calculateDistance(
          cityCoords.lat, cityCoords.lng,
          event.latitude, event.longitude
        );
        console.log(`Event "${event.title}": distance from ${selectedCity} = ${distance.toFixed(1)}km, radius = ${radius[0]}km`);
        if (distance > radius[0]) return false;
      } else if (!event.latitude || !event.longitude) {
        // If event has no geo data, fall back to city name matching
        const eventCity = event.address_city || event.location || "";
        if (!eventCity.toLowerCase().includes(selectedCity.toLowerCase())) return false;
      }
    }
    
    // Date filter - specific date
    if (selectedDate && event.start_date) {
      const eventDate = parseISO(event.start_date);
      if (!isSameDay(eventDate, selectedDate)) return false;
    }
    
    // Time filter (single-select)
    if (selectedTimeFilter && event.start_date) {
      const eventDate = parseISO(event.start_date);
      const now = new Date();
      
      let matchesTimeFilter = false;
      switch (selectedTimeFilter) {
        case "today":
          matchesTimeFilter = isToday(eventDate);
          break;
        case "tomorrow":
          matchesTimeFilter = isTomorrow(eventDate);
          break;
        case "thisWeek":
          matchesTimeFilter = isWithinInterval(eventDate, {
            start: startOfWeek(now, { weekStartsOn: 1 }),
            end: endOfWeek(now, { weekStartsOn: 1 })
          });
          break;
        case "nextWeek":
          const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
          const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
          matchesTimeFilter = isWithinInterval(eventDate, { start: nextWeekStart, end: nextWeekEnd });
          break;
        case "thisMonth":
          matchesTimeFilter = isWithinInterval(eventDate, {
            start: startOfMonth(now),
            end: endOfMonth(now)
          });
          break;
        default:
          matchesTimeFilter = true;
      }
      
      if (!matchesTimeFilter) return false;
    }
    
    // Quick filters - Romantik
    if (selectedQuickFilters.includes("romantik")) {
      if (!isRomanticEvent(event)) return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedTimeFilter(null);
    setSelectedQuickFilters([]);
    setSelectedPriceTier(null);
    setSelectedCity("");
    setRadius([0]);
    setSelectedCategory("all");
    setSelectedSubcategories([]);
  };

  const hasActiveFilters = 
    selectedDate !== undefined ||
    selectedTimeFilter !== null ||
    selectedQuickFilters.length > 0 ||
    selectedPriceTier !== null ||
    selectedCity !== "" ||
    radius[0] > 0 ||
    selectedCategory !== "all" ||
    selectedSubcategories.length > 0;

  const currentSubcategories = subcategories[selectedCategory] || subcategories.all;

  const formatEventDate = (dateString?: string) => {
    if (!dateString) return "Datum TBA";
    try {
      const date = parseISO(dateString);
      return format(date, "d. MMM yyyy", { locale: de });
    } catch {
      return "Datum TBA";
    }
  };

  const getEventLocation = (event: ExternalEvent) => {
    return event.address_city || event.location || event.venue_name || "Schweiz";
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Reset button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-stone-200"
        >
          ✕ Filter zurücksetzen
        </button>
      )}

      {/* Datum (Date) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Wann?</h3>
        <button 
          onClick={() => setShowCalendar(true)}
          className="w-full px-4 py-3.5 bg-white hover:bg-blue-50 rounded-xl text-blue-900 transition-all flex items-center justify-center gap-2.5 font-semibold border border-blue-200"
        >
          <CalendarIcon size={18} />
          <span className="text-sm">
            {selectedDate ? format(selectedDate, "d. MMMM yyyy", { locale: de }) : "Datum wählen"}
          </span>
        </button>
        
        {/* Time filter buttons - single-select, uniform size */}
        <div className="grid grid-cols-2 gap-2">
          {timeFilters.map((filter) => {
            const isActive = selectedTimeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => selectTimeFilter(filter.id)}
                className={cn(
                  "py-3 rounded-xl text-xs font-semibold transition-all text-center",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-900 hover:bg-blue-50 border border-blue-200"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schnellfilter (Quick Filters) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Stimmung</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedQuickFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleQuickFilter(filter.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-900 hover:bg-blue-50 border border-blue-200"
                )}
              >
                <Icon 
                  size={20} 
                  strokeWidth={1.8} 
                  className="mb-1"
                />
                <span className="text-[10px] font-bold leading-tight text-center">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget - Preisstufen */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Budget</h3>
        
        {/* Price tier pills - single select */}
        <TooltipProvider>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "gratis", label: "Gratis", tooltip: "Kostenlose Events" },
              { id: "$", label: "$", tooltip: "Budget (ca. bis 50 CHF)" },
              { id: "$$", label: "$$", tooltip: "Standard (ca. 50 - 120 CHF)" },
              { id: "$$$", label: "$$$", tooltip: "Premium (ab ca. 120 CHF)" },
            ].map((tier) => {
              const isActive = selectedPriceTier === tier.id;
              return (
                <Tooltip key={tier.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setSelectedPriceTier(isActive ? null : tier.id);
                      }}
                      className={cn(
                        "py-3 rounded-xl text-sm font-bold transition-all text-center",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-white text-blue-900 hover:bg-blue-50 border border-blue-200"
                      )}
                    >
                      {tier.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tier.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Stadt und Radius */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Wo?</h3>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
          <input
            type="text"
            placeholder="Stadt eingeben..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            list="cities"
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl text-sm text-blue-900 font-medium placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all border border-blue-200"
          />
          <datalist id="cities">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
        <div className="pt-2 px-1">
          <Slider
            value={radius}
            onValueChange={setRadius}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-blue-900 font-medium">Umkreis</span>
            <span className="text-sm font-bold text-blue-900 tabular-nums bg-white px-3 py-1 rounded-lg border border-blue-200">{radius[0]} km</span>
          </div>
        </div>
      </div>

      {/* Kategorie */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Kategorie</h3>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full rounded-xl border border-blue-200 bg-white py-3.5 text-sm font-medium text-blue-900 focus:ring-2 focus:ring-blue-300 hover:bg-blue-50 transition-all">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-blue-200 shadow-xl rounded-xl overflow-hidden z-50">
            {categories.map((cat) => (
              <SelectItem 
                key={cat.value} 
                value={cat.value} 
                className="cursor-pointer py-3 text-sm font-medium focus:bg-blue-50 text-blue-900"
              >
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subkategorie */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Art</h3>
        <div className="flex flex-wrap gap-2">
          {currentSubcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => toggleSubcategory(sub)}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-bold transition-all",
                selectedSubcategories.includes(sub)
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-900 hover:bg-blue-50 border border-blue-200"
              )}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-serif text-3xl md:text-4xl text-neutral-900">
            Events entdecken
          </h1>
          <p className="text-neutral-400 mt-1 text-sm">
            {loading ? "Lädt..." : `${filteredEvents.length} Events gefunden`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-10">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0 -mt-2">
            <div className="sticky top-24 bg-blue-50 rounded-2xl p-6 shadow-lg shadow-blue-200/50 border border-blue-200 max-h-[calc(100vh-120px)] overflow-y-auto">
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2.5 px-5 py-3 bg-white shadow-sm shadow-neutral-900/5 rounded-full text-sm font-medium text-neutral-700 hover:shadow-md transition-all"
              >
                <SlidersHorizontal size={16} />
                Filter
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-neutral-900 text-white rounded-full text-xs flex items-center justify-center">
                    {(selectedTimeFilter ? 1 : 0) + selectedQuickFilters.length + (selectedPriceTier ? 1 : 0) + selectedSubcategories.length}
                  </span>
                )}
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                  Erneut versuchen
                </button>
              </div>
            )}

            {/* Uniform Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredEvents.map((event, index) => {
                  // Use real image if available, otherwise fallback to placeholder
                  const eventImage = event.image_url || getPlaceholderImage(index);
                  // Use the database ID (not external_id) for routing - matches how EventDetail fetches
                  const eventSlug = event.id;
                  
                  return (
                    <Link
                      key={event.id}
                      to={`/event/${eventSlug}`}
                      className="block group"
                    >
                      <article className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-neutral-900/5 hover:shadow-2xl hover:shadow-neutral-900/15 hover:-translate-y-2 transition-all duration-500 ease-out">
                        <div className="relative overflow-hidden">
                          <img
                            src={eventImage}
                            alt={event.title}
                            className="w-full aspect-[5/6] object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite({
                                id: event.id,
                                slug: eventSlug,
                                title: event.title,
                                venue: event.venue_name || "",
                                location: getEventLocation(event),
                                image: eventImage,
                                date: formatEventDate(event.start_date),
                              });
                            }}
                            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-sm transition-all hover:scale-110"
                            aria-label={isFavorite(event.id) ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                          >
                            <Heart
                              size={16}
                              className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                            />
                          </button>
                        </div>

                        <div className="p-5">
                          <p className="text-xs text-neutral-400 mb-1.5 font-medium">
                            {formatEventDate(event.start_date)}
                          </p>
                          <h3 className="font-serif text-lg text-neutral-900 line-clamp-1 group-hover:text-neutral-700 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-sm text-neutral-400 mt-1.5 flex items-center gap-1.5">
                            <MapPin size={12} />
                            {getEventLocation(event)}
                          </p>
                          {/* Price Display */}
                          {(event.price_label || event.price_from) && (
                            <p className="text-sm font-medium text-neutral-900 mt-2">
                              {event.price_label 
                                ? event.price_label 
                                : event.price_to && event.price_to !== event.price_from
                                  ? `CHF ${event.price_from} – ${event.price_to}`
                                  : `ab CHF ${event.price_from}`}
                            </p>
                          )}
                          {event.short_description && (
                            <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                              {event.short_description}
                            </p>
                          )}
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && !error && filteredEvents.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Search size={24} className="text-neutral-400" />
                </div>
                <p className="text-neutral-500 mb-4">Keine Events gefunden.</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center">
                  <SlidersHorizontal size={14} className="text-white" />
                </div>
                <span className="font-semibold text-neutral-900 tracking-tight">Filter anpassen</span>
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <FilterContent />

            <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t border-neutral-100">
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-4 bg-neutral-100 rounded-2xl text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  Zurücksetzen
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 py-4 bg-neutral-900 text-white rounded-2xl text-sm font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20"
                >
                  {filteredEvents.length} Ergebnisse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-900">Datum auswählen</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="pointer-events-auto rounded-2xl"
              locale={de}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedDate(undefined);
                setShowCalendar(false);
              }}
              className="flex-1 py-3 bg-neutral-100 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              Zurücksetzen
            </button>
            <button
              onClick={() => setShowCalendar(false)}
              className="flex-1 py-3 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Bestätigen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Listings;
