import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  Smile,
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Music,
  Palette,
  UtensilsCrossed,
  Sparkles,
  Gift,
  Cake,
  CloudRain,
  Star,
  Camera,
  Heart,
  PartyPopper,
  Waves,
  Mountain,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { swissPlaces } from "@/utils/swissPlaces";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { de } from "date-fns/locale";


// NEU: Icon mapping (außerhalb der Komponente)
const getCategoryIcon = (slug: string | null) => {
  if (!slug) return LayoutGrid;
  if (slug === "musik-party") return Music;
  if (slug === "kunst-kultur") return Palette;
  if (slug === "kulinarik-genuss") return UtensilsCrossed;
  if (slug === "natur-ausfluege") return Sparkles;
  if (slug === "maerkte-stadtfeste") return Gift;
  return LayoutGrid;
};

// Stimmungen mit Icons
const moods = [
  { id: null, slug: null, name: "Jede Stimmung", icon: Smile },
  { id: "geburtstag", slug: "geburtstag", name: "Geburtstag", icon: Cake },
  { id: "mistwetter", slug: "mistwetter", name: "Mistwetter", icon: CloudRain },
  { id: "top-stars", slug: "top-stars", name: "Top Stars", icon: Star },
  { id: "foto-spots", slug: "foto-spots", name: "Foto-Spots", icon: Camera },
  { id: "romantik", slug: "romantik", name: "Romantik", icon: Heart },
  { id: "mit-kind", slug: "mit-kind", name: "Mit Kind", icon: Smile },
  { id: "nightlife", slug: "nightlife", name: "Nightlife", icon: PartyPopper },
  { id: "wellness", slug: "wellness", name: "Wellness", icon: Waves },
  { id: "natur", slug: "natur", name: "Natur", icon: Mountain },
];

// Zeit-Quick-Pills
const timePills = [
  { id: "now", label: "Jetzt" },
  { id: "today", label: "Heute" },
  { id: "thisWeek", label: "Wochenende" },
  { id: "thisMonth", label: "Dieser Monat" },
];

// City suggestions for autocomplete
const citySuggestions = swissPlaces.slice(0, 50).map((p) => p.name);

interface ListingsFilterBarProps {
  // Initial values from URL params
  initialCategory?: string | null;
  initialMood?: string | null;
  initialCity?: string | null;
  initialRadius?: number;
  initialTime?: string | null;
  initialDate?: Date | undefined;
  initialSearch?: string;
  // Callbacks
  onCategoryChange: (categoryId: number | null, categorySlug: string | null) => void;
  onMoodChange: (moodSlug: string | null) => void;
  onCityChange: (city: string) => void;
  onRadiusChange: (radius: number) => void;
  onTimeChange: (time: string | null) => void;
  onDateChange: (date: Date | undefined) => void;
  onSearchChange: (search: string) => void;
}

const ListingsFilterBar = ({
  initialCategory,
  initialMood,
  initialCity,
  initialRadius = 25,
  initialTime,
  initialDate,
  initialSearch = "",
  onCategoryChange,
  onMoodChange,
  onCityChange,
  onRadiusChange,
  onTimeChange,
  onDateChange,
  onSearchChange,
}: ListingsFilterBarProps) => {
  // Check if any dropdown is open (determines if we show collapse option)
  const isAnyDropdownOpen = () => categoryOpen || moodOpen || dateOpen || showCitySuggestions || radiusOpen;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState({
    id: null,
    slug: null,
    name: "Alle Kategorien",
    icon: LayoutGrid,
  });

  const [selectedMood, setSelectedMood] = useState(() => {
    if (initialMood) {
      return moods.find((m) => m.slug === initialMood) || moods[0];
    }
    return moods[0];
  });
  const [cityInput, setCityInput] = useState(initialCity || "");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [radius, setRadius] = useState([initialRadius]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [categories, setCategories] = useState<
    Array<{
      id: number | null;
      slug: string | null;
      name: string;
      icon: any;
    }>
  >([{ id: null, slug: null, name: "Alle Kategorien", icon: LayoutGrid }]);
  const [selectedTimePill, setSelectedTimePill] = useState<string | null>(initialTime || null);
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Dropdown states for inline expansion
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);

  // Handle search - only trigger on Enter or when 3+ characters
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchChange(searchInput);
    }
  };

  const handleSearchBlur = () => {
    if (searchInput.length >= 3 || searchInput.length === 0) {
      onSearchChange(searchInput);
    }
  };

  // Filter city suggestions
  const filteredCities = citySuggestions
    .filter((city) => city.toLowerCase().includes(cityInput.toLowerCase()))
    .slice(0, 8);

  // Handle city selection
  const handleCitySelect = (city: string) => {
    setCityInput(city);
    setShowCitySuggestions(false);
    setRadiusOpen(true);
    onCityChange(city);
  };

  // Handle city input change
  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setShowCitySuggestions(value.length > 0);
    onCityChange(value);
    if (value.length > 0) {
      setRadiusOpen(true);
    }
  };

  // Handle time pill click
  const handleTimePillClick = (pillId: string) => {
    const newValue = selectedTimePill === pillId ? null : pillId;
    setSelectedTimePill(newValue);
    setSelectedDate(undefined);
    onTimeChange(newValue);
    onDateChange(undefined);
    setDateOpen(false);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimePill(null);
    onDateChange(date);
    onTimeChange(null);
    setDateOpen(false);
  };

  // Handle category selection
  const handleCategorySelect = (cat: (typeof categories)[0]) => {
    setSelectedCategory(cat);
    onCategoryChange(cat.id, cat.slug);
    setCategoryOpen(false);
  };

  // Handle mood selection
  const handleMoodSelect = (mood: (typeof moods)[0]) => {
    setSelectedMood(mood);
    onMoodChange(mood.slug);
    setMoodOpen(false);
  };

  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    setRadius(value);
    onRadiusChange(value[0]);
  };

  // Close city suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        citySuggestionsRef.current &&
        !citySuggestionsRef.current.contains(e.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(e.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Load categories from taxonomy
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("taxonomy")
        .select("id, slug, name, type, display_order")
        .eq("type", "main")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Failed to load categories:", error);
        return;
      }

      if (data) {
        const loadedCategories = data.map((cat: any) => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          icon: getCategoryIcon(cat.slug),
        }));

        setCategories([{ id: null, slug: null, name: "Alle Kategorien", icon: LayoutGrid }, ...loadedCategories]);
      }
    };

    loadCategories();
  }, []);
  useEffect(() => {
    if (initialCategory && categories.length > 1) {
      const found = categories.find((c) => c.slug === initialCategory);
      if (found) {
        setSelectedCategory(found);
      }
    }
  }, [categories, initialCategory]);

  // Get date display text
  const getDateDisplayText = () => {
    if (selectedDate) {
      return format(selectedDate, "d. MMM", { locale: de });
    }
    if (selectedTimePill) {
      return timePills.find((p) => p.id === selectedTimePill)?.label || "Jederzeit";
    }
    return "Jederzeit";
  };

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setCategoryOpen(false);
    setMoodOpen(false);
    setDateOpen(false);
    setRadiusOpen(false);
    setShowCitySuggestions(false);
  };

  return (
    <div className="w-full mb-6">
      {/* Clean Filter Container */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Kategorie Button */}
          <button
            onClick={() => {
              setCategoryOpen(!categoryOpen);
              setMoodOpen(false);
              setDateOpen(false);
            }}
            className={cn(
              "px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium",
              categoryOpen 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background border-border hover:border-foreground/30 text-foreground",
            )}
          >
            <selectedCategory.icon size={16} className={categoryOpen ? "text-primary-foreground" : "text-muted-foreground"} />
            <span>{selectedCategory.name}</span>
            <ChevronDown
              size={14}
              className={cn("transition-transform", categoryOpen ? "rotate-180 text-primary-foreground" : "text-muted-foreground")}
            />
          </button>

          {/* Stimmung Button */}
          <button
            onClick={() => {
              setMoodOpen(!moodOpen);
              setCategoryOpen(false);
              setDateOpen(false);
            }}
            className={cn(
              "px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium",
              moodOpen 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background border-border hover:border-foreground/30 text-foreground",
            )}
          >
            <selectedMood.icon size={16} className={moodOpen ? "text-primary-foreground" : "text-muted-foreground"} />
            <span>{selectedMood.name}</span>
            <ChevronDown
              size={14}
              className={cn("transition-transform", moodOpen ? "rotate-180 text-primary-foreground" : "text-muted-foreground")}
            />
          </button>

          {/* Stadt Input */}
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={cityInputRef}
              type="text"
              placeholder="Stadt"
              value={cityInput}
              onChange={(e) => handleCityInputChange(e.target.value)}
              onFocus={() => cityInput.length > 0 && setShowCitySuggestions(true)}
              className="w-36 md:w-44 pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Datum Button */}
          <button
            onClick={() => {
              setDateOpen(!dateOpen);
              setCategoryOpen(false);
              setMoodOpen(false);
            }}
            className={cn(
              "px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium",
              dateOpen 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background border-border hover:border-foreground/30 text-foreground",
            )}
          >
            <CalendarIcon size={16} className={dateOpen ? "text-primary-foreground" : "text-muted-foreground"} />
            <span>{getDateDisplayText()}</span>
            <ChevronDown
              size={14}
              className={cn("transition-transform", dateOpen ? "rotate-180 text-primary-foreground" : "text-muted-foreground")}
            />
          </button>

          {/* Suche Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Name, Künstler..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={handleSearchBlur}
              className="w-40 md:w-48 pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Einklappen Button - nur sichtbar wenn ein Dropdown offen ist */}
          {isAnyDropdownOpen() && (
            <button
              onClick={closeAllDropdowns}
              className="ml-auto px-4 py-2 rounded-lg bg-muted text-muted-foreground font-medium text-sm hover:bg-muted/80 transition-all flex items-center gap-2"
            >
              <ChevronUp size={16} />
              <span>Schließen</span>
            </button>
          )}
        </div>

        {/* Expandable Dropdowns */}
        {(categoryOpen || moodOpen || dateOpen || showCitySuggestions || radiusOpen) && (
          <div className="bg-muted/50 rounded-lg p-4 mt-4 border border-border/50">
            {/* Category Dropdown */}
            {categoryOpen && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.slug || "all"}
                    onClick={() => handleCategorySelect(cat)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                      selectedCategory.slug === cat.slug
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background hover:bg-background/80 text-foreground border border-border",
                    )}
                  >
                    <cat.icon size={22} />
                    <span className="text-xs font-medium text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Mood Dropdown */}
            {moodOpen && (
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.slug || "all"}
                    onClick={() => handleMoodSelect(mood)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                      selectedMood.slug === mood.slug
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background hover:bg-background/80 text-foreground border border-border",
                    )}
                  >
                    <mood.icon size={18} />
                    <span className="text-[11px] font-medium text-center leading-tight">{mood.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* City Suggestions */}
            {showCitySuggestions && filteredCities.length > 0 && (
              <div ref={citySuggestionsRef} className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Vorschläge</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className="px-4 py-2 text-sm text-left bg-background hover:bg-background/80 rounded-lg transition-colors flex items-center gap-2 border border-border"
                    >
                      <MapPin size={14} className="text-muted-foreground" />
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Radius Slider */}
            {radiusOpen && cityInput && !showCitySuggestions && (
              <div className="max-w-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground font-medium">Umkreis</span>
                  <span className="text-sm font-semibold bg-background px-3 py-1 rounded-lg border border-border">{radius[0]} km</span>
                </div>
                <Slider value={radius} onValueChange={handleRadiusChange} max={100} step={5} className="w-full" />
              </div>
            )}

            {/* Date Dropdown */}
            {dateOpen && (
              <div className="flex flex-col md:flex-row gap-4">
                {/* Time Pills */}
                <div className="flex flex-wrap gap-2">
                  {timePills.map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => handleTimePillClick(pill.id)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        selectedTimePill === pill.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-background hover:bg-background/80 text-foreground border border-border",
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Calendar */}
                <div className="bg-background rounded-lg shadow-sm border border-border">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    locale={de}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsFilterBar;
