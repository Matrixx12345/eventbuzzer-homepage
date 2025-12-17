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
  Dog
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
import { Switch } from "@/components/ui/switch";
import { format, addDays, addWeeks, isToday, isTomorrow, parseISO, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isAfter, isBefore } from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
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
  available_months?: number[];
}

interface TaxonomyItem {
  id: number;
  name: string;
  type: 'main' | 'sub';
  parent_id: number | null;
}

// Quick filters with icons - using exact tag strings from backend
const quickFilters = [
  { id: "geburtstag", label: "Geburtstag", icon: Cake, tags: ["besondere-anlaesse", "freunde-gruppen"] },
  { id: "mistwetter", label: "Mistwetter", icon: CloudRain, tags: ["schlechtwetter-indoor"] },
  { id: "top-stars", label: "Top Stars", icon: Star, tags: ["vip-artists"] },
  { id: "foto-spots", label: "Foto-Spots", icon: Camera, tags: ["foto-spot"] },
  { id: "romantik", label: "Romantik", icon: HeartIcon, tags: ["romantisch-date"] },
  { id: "mit-kind", label: "Mit Kind", icon: Smile, tags: ["familie-kinder", "kleinkinder", "schulkinder", "teenager"] },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper, tags: ["nightlife-party", "afterwork", "rooftop-aussicht"] },
  { id: "wellness", label: "Wellness", icon: Waves, tags: ["wellness-selfcare"] },
  { id: "natur", label: "Natur", icon: Mountain, tags: ["natur-erlebnisse", "open-air"] },
];

const cities = ["Zürich", "Bern", "Basel", "Luzern", "Genf", "Baden", "Winterthur", "St. Gallen"];

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Events state
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [vipArtists, setVipArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  
  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Filter states
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
  
  // Current month for availability filtering
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isWinterSeason = [11, 12, 1, 2, 3].includes(currentMonth);
  
  // Availability filter options
  const availabilityFilters = [
    { id: "now", label: "Jetzt verfügbar", icon: Zap },
    { id: "winter", label: "Winter", icon: Snowflake },
    { id: "summer", label: "Sommer", icon: Sun },
    { id: "year-round", label: "Ganzjährig", icon: CalendarDays },
  ];
  
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

  // Time filter definitions - simplified for new layout
  const timeFilters = [
    { id: "today", label: "Heute" },
    { id: "tomorrow", label: "Morgen" },
    { id: "thisWeek", label: "Wochenende" },
  ];
  
  // Check if "Top Stars" filter is active (overrides radius)
  const isTopStarsActive = selectedQuickFilters.includes("top-stars");

  const selectTimeFilter = (filterId: string) => {
    // Single select - toggle off if already selected, otherwise select new one
    setSelectedTimeFilter((prev) => prev === filterId ? null : filterId);
    // Clear specific date when using time filters
    setSelectedDateRange(undefined);
    setSelectedDate(undefined);
  };

  // Fetch events from Supabase with pagination
  const fetchEvents = useCallback(async (isInitial: boolean = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        setEvents([]);
        setNextOffset(0);
      } else {
        setLoadingMore(true);
      }

      const offset = isInitial ? 0 : nextOffset;
      
      const { data, error: fetchError } = await supabase.functions.invoke('get-external-events', {
        body: { 
          offset,
          limit: 50,
          initialLoad: isInitial
        }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data?.events) {
        if (isInitial) {
          setEvents(data.events);
        } else {
          setEvents(prev => [...prev, ...data.events]);
        }
      }
      
      if (data?.pagination) {
        setHasMore(data.pagination.hasMore);
        setNextOffset(data.pagination.nextOffset);
        setTotalEvents(data.pagination.total);
        console.log(`Loaded ${data.events?.length} events. Total: ${data.pagination.total}, HasMore: ${data.pagination.hasMore}`);
      }

      if (isInitial) {
        if (data?.taxonomy) {
          setTaxonomy(data.taxonomy);
          console.log('Taxonomy loaded:', data.taxonomy.length, 'categories');
        }
        if (data?.vipArtists) {
          setVipArtists(data.vipArtists);
          console.log('VIP Artists loaded:', data.vipArtists.length, 'artists');
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [nextOffset]);

  // Initial load
  useEffect(() => {
    fetchEvents(true);
  }, []);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !loading) {
          console.log('Loading more events...');
          fetchEvents(false);
        }
      },
      { threshold: 0.1 }
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
    // Keep dialog open until both dates selected, or close if cleared
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
    
    // Single date filter
    if (selectedDate && event.start_date) {
      const eventDate = parseISO(event.start_date);
      if (!isSameDay(eventDate, selectedDate)) return false;
    }

    // Date range filter
    if (selectedDateRange?.from && event.start_date) {
      const eventDate = parseISO(event.start_date);
      if (selectedDateRange.to) {
        // Range selected - check if event is within range
        if (isBefore(eventDate, selectedDateRange.from) || isAfter(eventDate, selectedDateRange.to)) return false;
      } else {
        // Only "from" selected - match that specific day
        if (!isSameDay(eventDate, selectedDateRange.from)) return false;
      }
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
        case "thisWeek": {
          // Weekend = Saturday and Sunday of current week
          const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
          const saturday = addDays(weekEnd, -1);
          matchesTimeFilter = isSameDay(eventDate, saturday) || isSameDay(eventDate, weekEnd);
          break;
        }
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
    
    // Availability filter - based on available_months
    if (selectedAvailability) {
      const months = event.available_months || [];
      const winterMonths = [11, 12, 1, 2, 3];
      const summerMonths = [4, 5, 6, 7, 8, 9, 10];
      
      switch (selectedAvailability) {
        case "now":
          // Must include current month
          if (!months.includes(currentMonth)) return false;
          break;
        case "winter":
          // Must include at least one winter month
          if (!winterMonths.some(m => months.includes(m))) return false;
          break;
        case "summer":
          // Must include at least one summer month
          if (!summerMonths.some(m => months.includes(m))) return false;
          break;
        case "year-round":
          // Must be available all 12 months
          if (months.length !== 12) return false;
          break;
      }
    }
    // Dog-friendly filter - based on tag
    if (dogFriendly) {
      const eventTags = event.tags || [];
      if (!eventTags.includes("hunde-erlaubt")) return false;
    }
    
    return true;
  });

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
    // Prioritize address_city, skip location if it equals title (bad data)
    if (event.address_city) return event.address_city;
    if (event.location && event.location !== event.title) return event.location;
    return "Schweiz";
  };

  const filterContent = (
    <div className="space-y-5">
      {/* 1. WO / ORT - Location (TOP) */}
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
                  <span className={cn(
                    "text-sm font-semibold tabular-nums px-2 py-0.5 rounded-lg border",
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

      {/* 2. STIMMUNG - Quick Filters (3x3 grid, compact) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stimmung</h3>
        <TooltipProvider>
          {(() => {
            const rows: typeof quickFilters[] = [];
            for (let i = 0; i < quickFilters.length; i += 3) {
              rows.push(quickFilters.slice(i, i + 3));
            }
            
            const familyRowIndex = rows.findIndex(row => row.some(f => f.id === "mit-kind"));
            const mistwetterRowIndex = rows.findIndex(row => row.some(f => f.id === "mistwetter"));
            
            return (
              <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex}>
                    <div className="grid grid-cols-3 gap-1.5">
                      {row.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = selectedQuickFilters.includes(filter.id);
                        const isTopStars = filter.id === "top-stars";
                        
                        return (
                          <Tooltip key={filter.id}>
                            <TooltipTrigger asChild>
                                <button
                                onClick={() => toggleQuickFilter(filter.id)}
                                className={cn(
                                  "aspect-[4/3] flex flex-col items-center justify-center rounded-xl transition-all p-1.5",
                                  isActive && isTopStars
                                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                                    : isActive
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
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
                    
                    {/* Mistwetter drawer */}
                    {rowIndex === mistwetterRowIndex && isMistwetterFilterActive && (
                      <div className="mt-2 p-2.5 bg-neutral-800 rounded-xl border border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-200">
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
                    
                    {/* Mit Kind drawer */}
                    {rowIndex === familyRowIndex && isFamilyFilterActive && (
                      <div className="mt-2 p-2.5 bg-neutral-800 rounded-xl border border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-200">
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

      {/* 3. KATEGORIE - 2-column grid with icons */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategorie</h3>
        <div className="space-y-2">
          {/* Category tiles rendered row by row */}
          {(() => {
            const allCategories = [
              { id: null, name: "Alle Kategorien", icon: LayoutGrid },
              ...mainCategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: cat.name.includes("Musik") ? Music : 
                      cat.name.includes("Kunst") ? Palette : 
                      cat.name.includes("Kulinarik") || cat.name.includes("Genuss") ? UtensilsCrossed : 
                      cat.name.includes("Freizeit") ? Sparkles :
                      cat.name.includes("Märkte") ? Gift : LayoutGrid
              }))
            ];
            
            // Group into pairs (rows)
            const rows: typeof allCategories[] = [];
            for (let i = 0; i < allCategories.length; i += 2) {
              rows.push(allCategories.slice(i, i + 2));
            }
            
            return rows.map((row, rowIndex) => {
              // Check if any category in this row is selected
              const selectedInRow = row.find(cat => selectedCategoryId === cat.id && cat.id !== null);
              const relevantSubs = selectedInRow ? subCategories : [];
              
              return (
                <div key={rowIndex}>
                  {/* Row of 2 category tiles */}
                  <div className="grid grid-cols-2 gap-2">
                    {row.map((cat) => {
                      const isActive = selectedCategoryId === cat.id;
                      const IconComponent = cat.icon;
                      
                      return (
                        <button
                          key={cat.id ?? 'all'}
                          onClick={() => {
                            if (cat.id === null) {
                              setSelectedCategoryId(null);
                              setSelectedSubcategoryId(null);
                            } else if (selectedCategoryId === cat.id) {
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
                              : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
                          )}
                        >
                          <IconComponent size={24} className="mb-2" />
                          <span className="text-[13px] font-medium text-center leading-tight">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Subcategory drawer - appears below the row */}
                  {selectedInRow && relevantSubs.length > 0 && (
                    <div className="mt-2 bg-neutral-900 rounded-xl p-3 border border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => setSelectedSubcategoryId(null)}
                          className={cn(
                            "w-full px-3 py-2 rounded-full text-[13px] font-medium transition-all text-left",
                            selectedSubcategoryId === null
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-800 hover:bg-gray-100"
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
                              selectedSubcategoryId === sub.id
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-800 hover:bg-gray-100"
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

      {/* 4. ZEITRAUM - Time filters */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Wann?</h3>
        
        {/* Row 1: Prominent "JETZT" button */}
        <button
          onClick={() => selectTimeFilter("now")}
          className={cn(
            "w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
            selectedTimeFilter === "now"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
              : "bg-white text-gray-800 hover:bg-orange-50 border border-gray-200 hover:border-orange-300"
          )}
        >
          <Zap size={16} className={selectedTimeFilter === "now" ? "animate-pulse" : ""} />
          ⚡️ JETZT
        </button>
        
        {/* Row 2: Heute, Morgen, Wochenende chips */}
        <div className="grid grid-cols-3 gap-1.5">
          {timeFilters.map((filter) => {
            const isActive = selectedTimeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => selectTimeFilter(filter.id)}
                className={cn(
                  "h-9 px-2 rounded-lg text-xs font-medium transition-all text-center whitespace-nowrap",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        
        {/* Row 3: Date-Range-Picker */}
        <button 
          onClick={openRangeCalendar}
          className={cn(
            "w-full h-10 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
            selectedDateRange?.from
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
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

      {/* 5. BUDGET - Price tier buttons */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</h3>
        <TooltipProvider>
          <div className="grid grid-cols-4 gap-1.5">
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
                      onClick={() => setSelectedPriceTier(isActive ? null : tier.id)}
                      className={cn(
                        "h-10 px-2 rounded-xl text-xs font-semibold transition-all text-center",
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

      {/* 6. MIT HUND - Toggle Switch */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 px-1">
          <div className="flex items-center gap-2">
            <Dog size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Mit Hund erlaubt?</span>
          </div>
          <Switch
            checked={dogFriendly}
            onCheckedChange={setDogFriendly}
          />
        </div>
      </div>

      {/* 7. SUCHE - Text search (BOTTOM) */}
      <div className="space-y-3 pt-3 border-t border-neutral-700">
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

      {/* Reset button - at very bottom */}
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
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0 -mt-2">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl">
              {filterContent}
            </div>
            {/* Event Counter - below filter */}
            <div className="mt-4 px-2 text-xs text-neutral-500">
              {loading ? "Lädt..." : (
                <>
                  <p>{filteredEvents.length} von {totalEvents} Events</p>
                  <p className="text-neutral-400 mt-0.5">
                    {(() => {
                      const tm = filteredEvents.filter(e => e.external_id?.startsWith('tm_')).length;
                      const mys = filteredEvents.filter(e => e.external_id?.startsWith('mys_')).length;
                      const basel = filteredEvents.filter(e => e.external_id?.startsWith('basel_')).length;
                      const other = filteredEvents.length - tm - mys - basel;
                      const parts = [];
                      if (tm > 0) parts.push(`TM: ${tm}`);
                      if (mys > 0) parts.push(`MySW: ${mys}`);
                      if (basel > 0) parts.push(`Basel: ${basel}`);
                      if (other > 0) parts.push(`Andere: ${other}`);
                      return parts.join(' | ');
                    })()}
                  </p>
                </>
              )}
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
                  // Use real image for debugging - fallback to placeholder if missing
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

                          {/* Favorite Button - top right */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const wasNotFavorite = !isFavorite(event.id);
                              toggleFavorite({
                                id: event.id,
                                slug: eventSlug,
                                title: event.title,
                                venue: event.venue_name || "",
                                location: getEventLocation(event),
                                image: eventImage,
                                date: formatEventDate(event.start_date, event.external_id),
                              });
                              // Send like when adding to favorites
                              if (wasNotFavorite) {
                                sendLike(event.id);
                              }
                            }}
                            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-sm transition-all hover:scale-110"
                            aria-label={isFavorite(event.id) ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                          >
                            <Heart
                              size={16}
                              className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                            />
                          </button>

                          {/* Source Badge */}
                          {event.external_id && (
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {event.external_id.startsWith('tm_') ? 'TM' : 
                               event.external_id.startsWith('mys_') ? 'MySW' :
                               event.external_id.startsWith('basel_') ? 'BS' :
                               event.external_id.split('_')[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          {/* Date and Rating row */}
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                              <span>{formatEventDate(event.start_date, event.external_id)}</span>
                              {event.external_id?.startsWith("mys_") && event.available_months?.length === 12 && (
                                <span className="text-[11px] text-amber-600/80 font-medium tracking-wide">
                                  Ganzjährig
                                </span>
                              )}
                            </p>
                            <EventRatingButtons eventId={event.id} eventTitle={event.title} />
                          </div>
                          <h3 className="font-serif text-lg text-neutral-900 line-clamp-1 group-hover:text-neutral-700 transition-colors">
                            {event.title}
                          </h3>
                          {/* Location with Distance - VISIBLE on card */}
                          {(() => {
                            // Calculate distance to nearest city
                            let distanceInfo = "";
                            if (event.latitude && event.longitude) {
                              const cities = [
                                { name: "Zürich", lat: 47.3769, lng: 8.5417 },
                                { name: "Bern", lat: 46.948, lng: 7.4474 },
                                { name: "Basel", lat: 47.5596, lng: 7.5886 },
                                { name: "Genf", lat: 46.2044, lng: 6.1432 },
                                { name: "Luzern", lat: 47.0502, lng: 8.3093 },
                              ];
                              let nearest = cities[0], minDist = Infinity;
                              cities.forEach(c => {
                                const d = Math.sqrt(Math.pow((event.latitude! - c.lat) * 111, 2) + Math.pow((event.longitude! - c.lng) * 85, 2));
                                if (d < minDist) { minDist = d; nearest = c; }
                              });
                              const dLat = event.latitude - nearest.lat;
                              const dLng = event.longitude - nearest.lng;
                              const dir = dLat > 0.05 ? (dLng > 0.05 ? "NO" : dLng < -0.05 ? "NW" : "N") 
                                        : dLat < -0.05 ? (dLng > 0.05 ? "SO" : dLng < -0.05 ? "SW" : "S")
                                        : (dLng > 0.05 ? "O" : dLng < -0.05 ? "W" : "");
                              if (minDist > 3) {
                                distanceInfo = `~${Math.round(minDist)} km ${dir} von ${nearest.name}`;
                              } else if (minDist > 0.5) {
                                distanceInfo = `bei ${nearest.name}`;
                              }
                            }
                            
                            return (
                              <div className="group/map relative mt-1.5 cursor-help">
                                {/* Main Location Line - Always Visible */}
                                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                                  <MapPin size={14} className="text-red-500 flex-shrink-0" />
                                  <span className="truncate">{getEventLocation(event)}</span>
                                  {distanceInfo && (
                                    <span className="text-neutral-400 text-xs whitespace-nowrap">• {distanceInfo}</span>
                                  )}
                                </div>

                                {/* Swiss Map Tooltip - Only on Hover */}
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                                  <div className="bg-white p-3 rounded-xl shadow-2xl border border-gray-200 w-48 overflow-hidden">
                                    <div className="relative w-full h-32 bg-slate-50 rounded-lg overflow-hidden">
                                      <img 
                                        src="/swiss-outline.svg" 
                                        className="w-full h-full object-contain" 
                                        alt="CH" 
                                      />
                                      {event.latitude && event.longitude && (
                                        <div
                                          className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg"
                                          style={{
                                            // Map CH coords (lng: 5.95-10.49, lat: 45.82-47.81) to SVG viewBox (300x200)
                                            // SVG shape spans roughly x: 45-270 (75% width), y: 28-163 (67% height)
                                            left: `${15 + ((event.longitude - 5.95) / (10.49 - 5.95)) * 75}%`,
                                            top: `${14 + (1 - (event.latitude - 45.82) / (47.81 - 45.82)) * 67}%`,
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-2.5 h-2.5 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4" />
                                </div>
                              </div>
                            );
                          })()}
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

            {/* Infinite Scroll Trigger */}
            {!loading && !error && filteredEvents.length > 0 && (
              <div ref={loadMoreRef} className="py-10 flex flex-col items-center justify-center">
                {loadingMore ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    <span className="text-sm text-neutral-500">Lade weitere Events...</span>
                  </div>
                ) : hasMore ? (
                  <span className="text-sm text-neutral-400">Scrolle für mehr Events</span>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Check size={20} className="text-neutral-400" />
                    </div>
                    <span className="text-sm text-neutral-500">Alle {totalEvents} Events geladen</span>
                  </div>
                )}
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

      {/* Calendar Dialog - switches between single and range mode */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-900">
              {calendarMode === "single" ? "Datum auswählen" : "Zeitraum auswählen"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {calendarMode === "single" ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="pointer-events-auto rounded-2xl"
                locale={de}
              />
            ) : (
              <Calendar
                mode="range"
                selected={selectedDateRange}
                onSelect={handleDateRangeSelect}
                className="pointer-events-auto rounded-2xl"
                locale={de}
                numberOfMonths={1}
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (calendarMode === "single") {
                  setSelectedDate(undefined);
                } else {
                  setSelectedDateRange(undefined);
                }
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
