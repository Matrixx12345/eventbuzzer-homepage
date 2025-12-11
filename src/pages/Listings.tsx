import { useState, useEffect, useMemo } from "react";
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
  Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  category_main_id?: number;
  category_sub_id?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
}

interface TaxonomyItem {
  id: number;
  name: string;
  type: 'main' | 'sub';
  parent_id: number | null;
}

// Quick filters with icons
const quickFilters = [
  { id: "romantik", label: "Romantik", icon: HeartIcon, tags: ["romantisch-date"] },
  { id: "mit-kind", label: "Mit Kind", icon: Smile, tags: ["familie-kinder"] },
  { id: "mistwetter", label: "Mistwetter", icon: CloudRain, tags: ["schlechtwetter-indoor"] },
  { id: "top-stars", label: "Top Stars", icon: Star, tags: [] }, // Special logic, no tag filter
  { id: "wellness", label: "Wellness", icon: Waves, tags: ["wellness-selfcare"] },
  { id: "natur", label: "Natur & Outdoor", icon: Mountain, tags: ["natur-erlebnisse"] },
  { id: "foto-spots", label: "Foto-Spots", icon: Camera, tags: ["fotospots"] },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper, tags: ["nightlife-party", "afterwork", "rooftop-aussicht"] },
  { id: "geburtstag", label: "Geburtstag & Gruppen", icon: Cake, tags: ["besondere-anlaesse", "freunde-gruppen"] },
];

const cities = ["Zürich", "Bern", "Basel", "Luzern", "Genf", "Baden", "Winterthur", "St. Gallen"];

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Events state
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [vipArtists, setVipArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
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
  
  // Family age filter options
  const familyAgeFilters = [
    { id: "alle", label: "Alle Altersgruppen", tag: "familie-kinder" },
    { id: "kleinkinder", label: "Kleinkinder (0-4 J.)", tag: "kleinkinder" },
    { id: "schulkinder", label: "Schulkinder (5-10 J.)", tag: "schulkinder" },
    { id: "teenager", label: "Teenager (ab 11 J.)", tag: "teenager" },
  ];
  
  // Mistwetter / Indoor filter options
  const [selectedIndoorFilter, setSelectedIndoorFilter] = useState<string | null>(null);
  const indoorFilters = [
    { id: "alles-indoor", label: "Alles bei Mistwetter", tags: ["schlechtwetter-indoor"] },
    { id: "mit-kindern", label: "Mit Kindern", tags: ["schlechtwetter-indoor", "familie-kinder"] },
  ];
  
  // Check if "Mit Kind" filter is active (opens inline drawer)
  const isFamilyFilterActive = selectedQuickFilters.includes("mit-kind");
  
  // Check if "Mistwetter" filter is active (opens inline drawer)
  const isMistwetterFilterActive = selectedQuickFilters.includes("mistwetter");

  // Derive categories from taxonomy
  const mainCategories = useMemo(() => 
    taxonomy.filter(t => t.type === 'main').sort((a, b) => a.name.localeCompare(b.name)),
    [taxonomy]
  );

  const subCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return taxonomy.filter(t => t.type === 'sub' && t.parent_id === selectedCategoryId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [taxonomy, selectedCategoryId]);

  // Time filter definitions
  const timeFilters = [
    { id: "now", label: "Jetzt" },
    { id: "today", label: "Heute" },
    { id: "tomorrow", label: "Morgen" },
    { id: "thisWeek", label: "Diese Woche" },
    { id: "nextWeek", label: "Nächste Woche" },
    { id: "thisMonth", label: "Dieser Monat" },
  ];
  
  // Check if "Top Stars" filter is active (overrides radius)
  const isTopStarsActive = selectedQuickFilters.includes("top-stars");

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
        if (data?.taxonomy) {
          setTaxonomy(data.taxonomy);
          console.log('Taxonomy loaded:', data.taxonomy.length, 'categories');
        }
        if (data?.vipArtists) {
          setVipArtists(data.vipArtists);
          console.log('VIP Artists loaded:', data.vipArtists.length, 'artists');
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
    const isCurrentlyActive = selectedQuickFilters.includes(filterId);
    
    // If deselecting the current filter
    if (isCurrentlyActive) {
      if (filterId === "mit-kind") {
        setSelectedFamilyAgeFilter(null);
      }
      if (filterId === "mistwetter") {
        setSelectedIndoorFilter(null);
      }
      setSelectedQuickFilters([]);
      return;
    }
    
    // If selecting a new filter (single-select: replace all others)
    // Reset family age filter if switching away from "mit-kind"
    if (selectedQuickFilters.includes("mit-kind") && filterId !== "mit-kind") {
      setSelectedFamilyAgeFilter(null);
    }
    
    // Reset indoor filter if switching away from "mistwetter"
    if (selectedQuickFilters.includes("mistwetter") && filterId !== "mistwetter") {
      setSelectedIndoorFilter(null);
    }
    
    // If activating "mit-kind", set default age filter
    if (filterId === "mit-kind") {
      setSelectedFamilyAgeFilter("alle");
    }
    
    // If activating "mistwetter", set default indoor filter
    if (filterId === "mistwetter") {
      setSelectedIndoorFilter("alles-indoor");
    }
    
    // If activating "top-stars", reset category and subcategory to "Alle"
    if (filterId === "top-stars") {
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
    }
    
    setSelectedQuickFilters([filterId]); // Single-select: only this filter is active
  };

  const selectSubcategory = (subId: number) => {
    setSelectedSubcategoryId((prev) => prev === subId ? null : subId);
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

  // Check if event matches VIP artist (for "Top Stars" filter)
  // Uses word-boundary matching to avoid false positives like "YES" matching "YES: Spuren..."
  const isTopStarsEvent = (event: ExternalEvent) => {
    if (vipArtists.length === 0) {
      console.log('No VIP artists loaded!');
      return false;
    }
    
    const titleLower = (event.title || "").toLowerCase();
    
    // Check if any VIP artist name matches the event title
    const match = vipArtists.some(artist => {
      if (!artist || artist.length < 3) return false; // Skip very short names
      const artistLower = artist.toLowerCase().trim();
      
      // Check if the title STARTS with the artist name (most common pattern)
      // e.g., "Taylor Swift: The Eras Tour" starts with "Taylor Swift"
      if (titleLower.startsWith(artistLower)) return true;
      
      // Check for artist name as a distinct segment (with word boundaries)
      // This prevents "YES" from matching "YES: Spuren spüren" (which is theater, not the band YES)
      const regex = new RegExp(`\\b${artistLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(event.title || "")) return true;
      
      return false;
    });
    
    if (match) {
      console.log(`TOP STAR MATCH: "${event.title}"`);
    }
    
    return match;
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
    // Search filter - matches title, venue, location, description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchableText = [
        event.title,
        event.venue_name,
        event.address_city,
        event.location,
        event.short_description,
      ].filter(Boolean).join(" ").toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }
    
    // Strict price tier filter - price_label takes PRIORITY over price_from
    if (selectedPriceTier) {
      const price = event.price_from;
      const priceLabel = event.price_label || "";
      const hasPriceLabel = priceLabel === "$" || priceLabel === "$$" || priceLabel === "$$$";
      
      if (selectedPriceTier === "gratis") {
        // Gratis: price_from === 0 OR has gratis/kostenlos in label
        // If event has a price label ($, $$, $$$), it's NOT free
        if (hasPriceLabel) return false;
        const hasPrice = price !== null && price !== undefined;
        const isFree = hasPrice && price === 0;
        const hasFreeLabel = priceLabel.toLowerCase().includes("kostenlos") || priceLabel.toLowerCase().includes("gratis");
        if (!isFree && !hasFreeLabel) return false;
      } else if (selectedPriceTier === "$") {
        // Budget: If price_label exists, it MUST be "$"
        if (hasPriceLabel) {
          if (priceLabel !== "$") return false;
        } else {
          // No label: fall back to price_from range
          if (price === null || price === undefined || price <= 0 || price > 50) return false;
        }
      } else if (selectedPriceTier === "$$") {
        // Standard: If price_label exists, it MUST be "$$"
        if (hasPriceLabel) {
          if (priceLabel !== "$$") return false;
        } else {
          // No label: fall back to price_from range
          if (price === null || price === undefined || price <= 50 || price > 120) return false;
        }
      } else if (selectedPriceTier === "$$$") {
        // Premium: If price_label exists, it MUST be "$$$"
        if (hasPriceLabel) {
          if (priceLabel !== "$$$") return false;
        } else {
          // No label: fall back to price_from range
          if (price === null || price === undefined || price <= 120) return false;
        }
      }
    }
    
    // City filter (text-based) - SKIP if "Top Stars" is active (national mode)
    if (selectedCity && radius[0] === 0 && !isTopStarsActive) {
      const eventCity = event.address_city || event.location || "";
      if (!eventCity.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    }
    
    // Radius filter (geo-based) - SKIP if "Top Stars" is active (national mode)
    if (selectedCity && radius[0] > 0 && !isTopStarsActive) {
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
    if (selectedTimeFilter) {
      // Events without start_date should be EXCLUDED from specific time filters
      // (they can't match "today", "tomorrow", etc. since they have no date)
      if (!event.start_date) {
        return false;
      }
      
      const eventDate = parseISO(event.start_date);
      const now = new Date();
      
      let matchesTimeFilter = false;
      switch (selectedTimeFilter) {
        case "now": {
          // Events starting within the next 4 hours (regardless of day)
          const eventTime = eventDate.getTime();
          const currentTime = now.getTime();
          const fourHoursFromNow = currentTime + (4 * 60 * 60 * 1000);
          // Event already started today OR starts within 4 hours
          matchesTimeFilter = (isToday(eventDate) && eventTime <= currentTime) || 
                              (eventTime >= currentTime && eventTime <= fourHoursFromNow);
          break;
        }
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
    
    // Quick filters - Romantik (tag-based + keyword fallback)
    if (selectedQuickFilters.includes("romantik")) {
      const eventTags = event.tags || [];
      const hasRomanticTag = eventTags.includes("romantisch-date");
      // Fallback to keyword matching if no tag
      if (!hasRomanticTag && !isRomanticEvent(event)) return false;
    }
    
    // Quick filters - Top Stars (filter by VIP artists, radius already disabled above)
    if (selectedQuickFilters.includes("top-stars")) {
      console.log(`Top Stars filter active. VIP Artists count: ${vipArtists.length}, CategoryId: ${selectedCategoryId}, SubcategoryId: ${selectedSubcategoryId}`);
      if (!isTopStarsEvent(event)) return false;
    }
    
    // Quick filters - Mit Kind (filter by family/age tags)
    if (selectedQuickFilters.includes("mit-kind")) {
      const eventTags = event.tags || [];
      // Determine which tag to filter by based on selected age filter
      const tagToMatch = selectedFamilyAgeFilter === "alle" || selectedFamilyAgeFilter === null
        ? "familie-kinder"
        : selectedFamilyAgeFilter;
      
      if (!eventTags.includes(tagToMatch)) return false;
    }
    
    // Quick filters - Mistwetter / Indoor (filter by indoor/wellness tags)
    if (selectedQuickFilters.includes("mistwetter")) {
      const eventTags = event.tags || [];
      const currentFilter = indoorFilters.find(f => f.id === selectedIndoorFilter) || indoorFilters[0];
      
      // Event must have ALL tags required by the filter
      const hasAllTags = currentFilter.tags.every(tag => eventTags.includes(tag));
      if (!hasAllTags) return false;
    }
    
    // Quick filters - Wellness (tag-based)
    if (selectedQuickFilters.includes("wellness")) {
      const eventTags = event.tags || [];
      if (!eventTags.includes("wellness-selfcare")) return false;
    }
    
    // Quick filters - Natur & Outdoor (tag-based)
    if (selectedQuickFilters.includes("natur")) {
      const eventTags = event.tags || [];
      if (!eventTags.includes("natur-erlebnisse")) return false;
    }
    
    // Quick filters - Foto-Spots (tag-based)
    if (selectedQuickFilters.includes("foto-spots")) {
      const eventTags = event.tags || [];
      if (!eventTags.includes("fotospots")) return false;
    }
    
    // Quick filters - Nightlife (OR logic: any of the tags)
    if (selectedQuickFilters.includes("nightlife")) {
      const eventTags = event.tags || [];
      const nightlifeTags = ["nightlife-party", "afterwork", "rooftop-aussicht"];
      const hasAnyTag = nightlifeTags.some(tag => eventTags.includes(tag));
      if (!hasAnyTag) return false;
    }
    
    // Quick filters - Geburtstag & Gruppen (OR logic: any of the tags)
    if (selectedQuickFilters.includes("geburtstag")) {
      const eventTags = event.tags || [];
      const birthdayTags = ["besondere-anlaesse", "freunde-gruppen"];
      const hasAnyTag = birthdayTags.some(tag => eventTags.includes(tag));
      if (!hasAnyTag) return false;
    }
    
    // Source filter (based on external_id prefix)
    if (selectedSource) {
      const externalId = event.external_id || "";
      if (selectedSource === "ticketmaster" && !externalId.startsWith("tm_")) return false;
      if (selectedSource === "myswitzerland" && !externalId.startsWith("mys_")) return false;
    }
    
    // Category filter - by category_main_id (SKIP if Top Stars is active)
    if (selectedCategoryId !== null && !selectedQuickFilters.includes("top-stars")) {
      if (event.category_main_id !== selectedCategoryId) return false;
    }
    
    // Subcategory filter - by category_sub_id (SKIP if Top Stars is active)
    if (selectedSubcategoryId !== null && !selectedQuickFilters.includes("top-stars")) {
      if (event.category_sub_id !== selectedSubcategoryId) return false;
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
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedSource(null);
    setSearchQuery("");
    setSelectedFamilyAgeFilter(null);
    setSelectedIndoorFilter(null);
  };

  const hasActiveFilters = 
    selectedDate !== undefined ||
    selectedTimeFilter !== null ||
    selectedQuickFilters.length > 0 ||
    selectedPriceTier !== null ||
    selectedCity !== "" ||
    radius[0] > 0 ||
    selectedCategoryId !== null ||
    selectedSubcategoryId !== null ||
    selectedSource !== null ||
    searchQuery.trim() !== "";

  const formatEventDate = (dateString?: string, externalId?: string) => {
    // MySwitzerland events (permanent attractions) have null dates
    if (!dateString) {
      const isMySwitzerland = externalId?.startsWith('mys_');
      return isMySwitzerland ? "Jederzeit" : "Datum TBA";
    }
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

  const filterContent = (
    <div className="space-y-6">
      {/* Reset button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-stone-200"
        >
          ✕ Filter zurücksetzen
        </button>
      )}

      {/* Search Bar */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suche</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Künstler, Event, Stichwort..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all border border-gray-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Datum (Date) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Wann?</h3>
        
        <button 
          onClick={() => setShowCalendar(true)}
          className="w-full px-5 py-2.5 bg-white hover:bg-gray-50 rounded-xl text-gray-800 transition-all flex items-center justify-center gap-2 font-medium border border-gray-200"
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
            const isNow = filter.id === "now";
            return (
              <button
                key={filter.id}
                onClick={() => selectTimeFilter(filter.id)}
                className={cn(
                  "h-11 px-4 rounded-xl text-sm font-medium transition-all text-center whitespace-nowrap flex items-center justify-center gap-1.5",
                  isActive && isNow
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                    : isActive
                    ? "bg-blue-600 text-white"
                    : isNow
                    ? "bg-white text-gray-800 hover:bg-orange-50 border border-gray-200 hover:border-orange-300"
                    : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
                )}
              >
                {isNow && <Zap size={14} className={isActive ? "animate-pulse" : ""} />}
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schnellfilter (Quick Filters) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stimmung</h3>
        <TooltipProvider>
          {(() => {
            // Group quick filters into rows of 3
            const rows: typeof quickFilters[] = [];
            for (let i = 0; i < quickFilters.length; i += 3) {
              rows.push(quickFilters.slice(i, i + 3));
            }
            
            // Find which row contains "mit-kind" (to show drawer below it)
            const familyRowIndex = rows.findIndex(row => row.some(f => f.id === "mit-kind"));
            // Find which row contains "mistwetter" (to show drawer below it)
            const mistwetterRowIndex = rows.findIndex(row => row.some(f => f.id === "mistwetter"));
            
            return (
              <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex}>
                    {/* Row of 3 quick filter buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {row.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = selectedQuickFilters.includes(filter.id);
                        const isTopStars = filter.id === "top-stars";
                        const isMitKind = filter.id === "mit-kind";
                        const isMistwetter = filter.id === "mistwetter";
                        
                        const buttonElement = (
                          <button
                            key={filter.id}
                            onClick={() => toggleQuickFilter(filter.id)}
                            className={cn(
                              "aspect-square flex flex-col items-center justify-center rounded-xl transition-all",
                              isActive && isTopStars
                                ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                                : isActive && isMitKind
                                ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30"
                                : isActive && isMistwetter
                                ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30"
                                : isActive
                                ? "bg-blue-600 text-white"
                                : isTopStars
                                ? "bg-white text-gray-800 hover:bg-amber-50 border border-gray-200 hover:border-amber-300"
                                : isMitKind
                                ? "bg-white text-gray-800 hover:bg-pink-50 border border-gray-200 hover:border-pink-300"
                                : isMistwetter
                                ? "bg-white text-gray-800 hover:bg-sky-50 border border-gray-200 hover:border-sky-300"
                                : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
                            )}
                          >
                            <Icon 
                              size={20} 
                              strokeWidth={1.8} 
                              className={cn("mb-1", (isActive && isTopStars) && "fill-white")}
                            />
                            <span className="text-xs font-medium leading-tight text-center">{filter.label}</span>
                          </button>
                        );
                        
                        if (isTopStars) {
                          return (
                            <Tooltip key={filter.id}>
                              <TooltipTrigger asChild>
                                {buttonElement}
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[180px]">
                                <p className="text-center">Grosse Events schweizweit – ohne lokale Einschränkung</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        
                        return buttonElement;
                      })}
                    </div>
                    
                    {/* Inline Drawer for "Mistwetter" - appears below the row containing it */}
                    {rowIndex === mistwetterRowIndex && isMistwetterFilterActive && (
                      <div className="mt-2 p-3 bg-neutral-800 rounded-xl border border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col gap-2">
                          {indoorFilters.map((indoorFilter) => {
                            const isIndoorActive = selectedIndoorFilter === indoorFilter.id;
                            return (
                              <button
                                key={indoorFilter.id}
                                onClick={() => setSelectedIndoorFilter(indoorFilter.id)}
                                className={cn(
                                  "w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all text-left",
                                  isIndoorActive
                                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                                    : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-200"
                                )}
                              >
                                {indoorFilter.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Inline Drawer for "Mit Kind" - appears below the row containing it */}
                    {rowIndex === familyRowIndex && isFamilyFilterActive && (
                      <div className="mt-2 p-3 bg-neutral-800 rounded-xl border border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col gap-2">
                          {familyAgeFilters.map((ageFilter) => {
                            const isAgeActive = selectedFamilyAgeFilter === ageFilter.id;
                            return (
                              <button
                                key={ageFilter.id}
                                onClick={() => setSelectedFamilyAgeFilter(ageFilter.id)}
                                className={cn(
                                  "w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all text-left",
                                  isAgeActive
                                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                                    : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-200"
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

      {/* Budget - Preisstufen */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</h3>
        
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
                        "h-11 px-3 rounded-xl text-sm font-semibold transition-all text-center",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
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
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Wo?</h3>
          {isTopStarsActive && (
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
              <Star size={12} className="fill-amber-400" />
              National
            </span>
          )}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                : "bg-white text-gray-800 border-gray-200"
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
              <div className={cn("pt-2 px-1", isTopStarsActive && "opacity-50 cursor-not-allowed")}>
                <Slider
                  value={radius}
                  onValueChange={isTopStarsActive ? undefined : setRadius}
                  max={100}
                  step={5}
                  className="w-full"
                  disabled={isTopStarsActive}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400 font-medium">Umkreis</span>
                  <span className={cn(
                    "text-sm font-semibold tabular-nums px-2.5 py-1 rounded-lg border",
                    isTopStarsActive 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-white text-gray-800 border-gray-200"
                  )}>
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

      {/* Kategorie - Inline Drawer Pattern */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategorie</h3>
        
        {/* Category grid with inline drawer for subcategories */}
        {(() => {
          const orderedCategories = ['Musik & Party', 'Kunst & Kultur', 'Kulinarik & Genuss', 'Freizeit & Aktivitäten', 'Märkte & Lokales'];
          
          const getCategoryIcon = (name: string) => {
            const lower = name.toLowerCase();
            if (lower.includes('musik')) return Music;
            if (lower.includes('kunst')) return Palette;
            if (lower.includes('kulinarik')) return UtensilsCrossed;
            if (lower.includes('freizeit')) return Sparkles;
            if (lower.includes('märkte')) return Heart;
            return Sparkles;
          };
          
          // Build array with categories + "Alle" at the end
          const allItems = [
            ...orderedCategories.map(catName => {
              const cat = mainCategories.find(c => c.name === catName);
              return cat ? { id: cat.id, name: cat.name, icon: getCategoryIcon(cat.name) } : null;
            }).filter(Boolean) as { id: number; name: string; icon: typeof Music }[],
            { id: null, name: 'Alle Kategorien', icon: LayoutGrid },
          ];
          
          // Group items into rows of 2
          const rows: typeof allItems[] = [];
          for (let i = 0; i < allItems.length; i += 2) {
            rows.push(allItems.slice(i, i + 2));
          }
          
          // Find which row contains the selected category (to show drawer below it)
          const selectedRowIndex = selectedCategoryId !== null 
            ? rows.findIndex(row => row.some(item => item.id === selectedCategoryId))
            : -1;
          
          return (
            <div className="space-y-2">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex}>
                  {/* Row of 2 category cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {row.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.id === null 
                        ? selectedCategoryId === null 
                        : selectedCategoryId === item.id;
                      
                      return (
                        <button
                          key={item.id ?? 'alle'}
                          onClick={() => {
                            if (item.id === null) {
                              setSelectedCategoryId(null);
                              setSelectedSubcategoryId(null);
                            } else {
                              // Toggle: if clicking same category, deselect
                              if (selectedCategoryId === item.id) {
                                setSelectedCategoryId(null);
                                setSelectedSubcategoryId(null);
                              } else {
                                setSelectedCategoryId(item.id);
                                setSelectedSubcategoryId(null);
                              }
                            }
                          }}
                          className={cn(
                            "h-20 flex flex-col items-center justify-center rounded-xl transition-all",
                            isActive
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
                          )}
                        >
                          <Icon 
                            size={20} 
                            strokeWidth={1.8} 
                            className="mb-1"
                          />
                          <span className="text-xs font-medium leading-tight text-center">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Inline Drawer - appears below the row containing the selected category */}
                  {rowIndex === selectedRowIndex && selectedCategoryId !== null && subCategories.length > 0 && (
                    <div className="mt-2 p-3 bg-neutral-800 rounded-xl border border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Single column - full width pills stacked */}
                      <div className="flex flex-col gap-2">
                        {/* "Alle" chip */}
                        <button
                          onClick={() => setSelectedSubcategoryId(null)}
                          className={cn(
                            "w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all text-left",
                            selectedSubcategoryId === null
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-200"
                          )}
                        >
                          Alle
                        </button>
                        {/* Subcategory chips - allow text wrapping */}
                        {subCategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubcategoryId(selectedSubcategoryId === sub.id ? null : sub.id)}
                            className={cn(
                              "w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all text-left leading-snug",
                              selectedSubcategoryId === sub.id
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-200"
                            )}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Quelle (Source) - at bottom */}
      <div className="space-y-3 pt-4 border-t border-neutral-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datenquelle</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "ticketmaster", label: "Ticketmaster" },
            { id: "myswitzerland", label: "MySwitzerland" },
          ].map((source) => {
            const isActive = selectedSource === source.id;
            return (
              <button
                key={source.id}
                onClick={() => setSelectedSource(isActive ? null : source.id)}
                className={cn(
                  "h-11 px-4 rounded-xl text-sm font-medium transition-all text-center",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
                )}
              >
                {source.label}
              </button>
            );
          })}
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
          <aside className="hidden lg:block w-[340px] flex-shrink-0 -mt-2">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl">
              {filterContent}
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
                    {(selectedTimeFilter ? 1 : 0) + selectedQuickFilters.length + (selectedPriceTier ? 1 : 0) + (selectedCategoryId ? 1 : 0) + (selectedSubcategoryId ? 1 : 0)}
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
                                date: formatEventDate(event.start_date, event.external_id),
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
                            {formatEventDate(event.start_date, event.external_id)}
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

            {filterContent}

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
