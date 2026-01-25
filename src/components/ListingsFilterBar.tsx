import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  Smile,
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown,
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
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { swissPlaces } from "@/utils/swissPlaces";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const getCategoryIcon = (slug: string | null) => {
  if (!slug) return LayoutGrid;
  if (slug === "musik-party") return Music;
  if (slug === "kunst-kultur") return Palette;
  if (slug === "kulinarik-genuss") return UtensilsCrossed;
  if (slug === "natur-ausfluege") return Sparkles;
  if (slug === "maerkte-stadtfeste") return Gift;
  return LayoutGrid;
};

const moods = [
  { id: "geburtstag", slug: "geburtstag", name: "Geburtstag", icon: Cake },
  { id: "mistwetter", slug: "mistwetter", name: "Mistwetter", icon: CloudRain },
  { id: "must-see", slug: "must-see", name: "Must-See", icon: Star },
  { id: "top-stars", slug: "top-stars", name: "Top Stars", icon: Star },
  { id: "foto-spots", slug: "foto-spots", name: "Foto-Spots", icon: Camera },
  { id: "romantik", slug: "romantik", name: "Romantik", icon: Heart },
  { id: "familie-freundlich", slug: "familie-freundlich", name: "Familie", icon: Smile },
  { id: "nightlife", slug: "nightlife", name: "Nightlife", icon: PartyPopper },
  { id: "wellness", slug: "wellness", name: "Wellness", icon: Waves },
];

const timePills = [
  { id: "any", label: "Egal wann" },
  { id: "now", label: "Jetzt" },
  { id: "today", label: "Heute" },
  { id: "tomorrow", label: "Morgen" },
  { id: "thisWeek", label: "Dieses WE" },
  { id: "thisMonth", label: "Dieser Monat" },
];

const citySuggestions = swissPlaces.slice(0, 50).map((p) => p.name);

interface ListingsFilterBarProps {
  initialCategory?: string | null;
  initialMood?: string | null;
  initialCity?: string | null;
  initialRadius?: number;
  initialTime?: string | null;
  initialDate?: Date | undefined;
  initialSearch?: string;
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
  const [selectedCategory, setSelectedCategory] = useState({
    id: null as number | null,
    slug: null as string | null,
    name: "Kategorie",
    icon: LayoutGrid,
  });

  const [selectedMood, setSelectedMood] = useState(() => {
    if (initialMood) {
      return moods.find((m) => m.slug === initialMood) || { id: null, slug: null, name: "Jede Stimmung", icon: Smile };
    }
    return { id: null, slug: null, name: "Jede Stimmung", icon: Smile };
  });
  const [cityInput, setCityInput] = useState(initialCity || "");
  const [radius, setRadius] = useState([initialRadius]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [categories, setCategories] = useState<
    Array<{ id: number | null; slug: string | null; name: string; icon: any }>
  >([{ id: null, slug: null, name: "Alle", icon: LayoutGrid }]);
  const [selectedTimePill, setSelectedTimePill] = useState<string | null>(initialTime || null);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ id: string; title: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Which dropdown is open
  const [openSection, setOpenSection] = useState<"category" | "mood" | "location" | "date" | null>(null);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredCities = citySuggestions
    .filter((city) => city.toLowerCase().includes(cityInput.toLowerCase()))
    .slice(0, 6);

  // Fetch initial/popular events for empty search
  const fetchInitialSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Initial suggestions error:", error);
      } else if (data) {
        setSearchSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Initial suggestions fetch error:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Search for suggestions (from 1 character)
  const fetchSearchSuggestions = async (query: string) => {
    if (query.length < 1) {
      fetchInitialSuggestions();
      return;
    }
    
    setLoadingSuggestions(true);
    try {
      // Search for words that START with the query (not just contain it anywhere)
      // Matches: title starts with query OR any word in title starts with query
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .or(`title.ilike.${query}%,title.ilike.% ${query}%`)
        .limit(6);
      
      if (error) {
        console.error("Search suggestions error:", error);
        setSearchSuggestions([]);
      } else if (data) {
        setSearchSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Search suggestions fetch error:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce the API call
    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 200);
  };

  const handleSearchFocus = () => {
    if (searchInput.length >= 1 && searchSuggestions.length > 0) {
      setShowSuggestions(true);
    } else if (searchInput.length === 0) {
      fetchInitialSuggestions();
    }
  };

  const handleSuggestionClick = (suggestion: { id: string; title: string }) => {
    setSearchInput(suggestion.title);
    setShowSuggestions(false);
    onSearchChange(suggestion.title);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearchChange(searchInput);
  };

  const handleSearchBlur = () => {
    if (searchInput.length >= 3 || searchInput.length === 0) onSearchChange(searchInput);
  };

  const handleCitySelect = (city: string) => {
    setCityInput(city);
    onCityChange(city);
  };

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    onCityChange(value);
  };

  const handleTimePillClick = (pillId: string) => {
    const newValue = selectedTimePill === pillId ? null : pillId;
    setSelectedTimePill(newValue);
    setSelectedDate(undefined);
    onTimeChange(newValue);
    onDateChange(undefined);
    setOpenSection(null);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimePill(null);
    onDateChange(date);
    onTimeChange(null);
    setOpenSection(null);
  };

  const handleCategorySelect = (cat: (typeof categories)[0]) => {
    setSelectedCategory(cat);
    onCategoryChange(cat.id, cat.slug);
    setOpenSection(null);
  };

  const handleMoodSelect = (mood: (typeof moods)[0]) => {
    setSelectedMood(mood);
    onMoodChange(mood.slug);

    // When a mood is selected (not "Alle"), reset category to "Alle"
    if (mood.slug !== null) {
      const allCategory = categories.find(c => c.slug === null);
      if (allCategory) {
        setSelectedCategory(allCategory);
        onCategoryChange(null, null);
      }
    }

    setOpenSection(null);
  };

  const handleRadiusChange = (value: number[]) => {
    setRadius(value);
    onRadiusChange(value[0]);
  };

  const toggleSection = (section: typeof openSection) => {
    setOpenSection(openSection === section ? null : section);
  };

  const getDateDisplayText = () => {
    if (selectedDate) return format(selectedDate, "d. MMM", { locale: de });
    if (selectedTimePill) return timePills.find((p) => p.id === selectedTimePill)?.label || "Wann";
    return "Wann";
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenSection(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("taxonomy")
        .select("id, slug, name, type, display_order")
        .eq("type", "main")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) return;

      if (data) {
        const loadedCategories = data.map((cat: any) => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          icon: getCategoryIcon(cat.slug),
        }));
        setCategories([{ id: null, slug: null, name: "Alle", icon: LayoutGrid }, ...loadedCategories]);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialCategory && categories.length > 1) {
      const found = categories.find((c) => c.slug === initialCategory);
      if (found) setSelectedCategory(found);
    }
  }, [categories, initialCategory]);

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Main Filter Bar - White bar with dark text */}
      <div className="flex items-stretch bg-white rounded-2xl shadow-xl overflow-visible">
        {/* Kategorie */}
        <div className="relative flex-1 min-w-0 h-14">
          <button
            onClick={() => toggleSection("category")}
            className={cn(
              "flex items-center gap-3 px-5 h-full transition-colors w-full rounded-l-2xl",
              selectedCategory.slug
                ? "bg-amber-700 text-white"
                : "bg-white",
              openSection === "category" && !selectedCategory.slug && "bg-gray-50",
              !selectedCategory.slug && openSection !== "category" && "hover:bg-gray-50"
            )}
          >
            <LayoutGrid className={cn("w-5 h-5 flex-shrink-0", selectedCategory.slug ? "text-white" : "text-gray-400")} />
            <span className={cn("font-medium text-sm truncate", selectedCategory.slug ? "text-white" : "text-gray-900")}>
              {selectedCategory.slug ? selectedCategory.name : "Alle Kategorien"}
            </span>
            <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", openSection === "category" && "rotate-180", selectedCategory.slug ? "text-white" : "text-gray-400")} />
          </button>
          
          {/* Category Dropdown */}
          {openSection === "category" && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-xl z-50 min-w-[220px] animate-fade-in">
              <div className="grid gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.slug || "all"}
                    onClick={() => handleCategorySelect(cat)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-full",
                      selectedCategory.slug === cat.slug
                        ? "bg-amber-600 text-white"
                        : "hover:bg-gray-100 text-gray-900"
                    )}
                  >
                    <cat.icon size={16} className="flex-shrink-0" />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={cn("w-px self-stretch my-3 transition-colors", (selectedCategory.slug || selectedMood.slug) ? "bg-transparent" : "bg-gray-200")} />

        {/* Stimmung */}
        <div className="relative flex-1 min-w-0 h-14">
          <button
            onClick={() => toggleSection("mood")}
            className={cn(
              "flex items-center gap-3 px-5 h-full transition-colors w-full",
              selectedMood.slug
                ? "bg-slate-100 text-slate-900"
                : "bg-white",
              openSection === "mood" && !selectedMood.slug && "bg-gray-50",
              !selectedMood.slug && openSection !== "mood" && "hover:bg-gray-50"
            )}
          >
            <Smile className={cn("w-5 h-5 flex-shrink-0", selectedMood.slug ? "text-slate-700" : "text-gray-400")} />
            <span className={cn("font-medium text-sm truncate", selectedMood.slug ? "text-slate-900" : "text-gray-900")}>
              {selectedMood.slug ? selectedMood.name : "Jede Stimmung"}
            </span>
            <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", openSection === "mood" && "rotate-180", selectedMood.slug ? "text-slate-700" : "text-gray-400")} />
          </button>
          
          {/* Mood Dropdown - Premium 3x3 Grid */}
          {openSection === "mood" && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-100/50 z-50 w-[300px] animate-fade-in">
              {/* Clear Button */}
              {selectedMood.slug && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => handleMoodSelect({ id: null, slug: null, name: "Jede Stimmung", icon: Smile })}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Auswahl löschen"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-2">
                {moods.map((mood) => {
                  const isSelected = selectedMood.slug === mood.slug;
                  return (
                    <button
                      key={mood.slug}
                      onClick={() => handleMoodSelect(mood)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all bg-white/80 hover:bg-white hover:shadow-md",
                        isSelected && "ring-2 ring-slate-300 shadow-lg bg-slate-50"
                      )}
                    >
                      <mood.icon size={22} className="flex-shrink-0 text-gray-800" />
                      <span className="text-[11px] font-medium text-gray-800 text-center leading-tight">{mood.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={cn("w-px self-stretch my-3 transition-colors", (selectedMood.slug || cityInput) ? "bg-transparent" : "bg-gray-200")} />

        {/* Ort */}
        <div className="relative flex-1 min-w-0 h-14">
          <button
            onClick={() => toggleSection("location")}
            className={cn(
              "flex items-center gap-3 px-5 h-full transition-colors w-full",
              cityInput
                ? "bg-amber-700 text-white"
                : "bg-white",
              openSection === "location" && !cityInput && "bg-gray-50",
              !cityInput && openSection !== "location" && "hover:bg-gray-50"
            )}
          >
            <MapPin className={cn("w-5 h-5 flex-shrink-0", cityInput ? "text-white" : "text-gray-400")} />
            <div className="text-left min-w-0 flex-1">
              <div className={cn("font-medium text-sm truncate", cityInput ? "text-white" : "text-gray-900")}>
                {cityInput || "Ort"}
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", openSection === "location" && "rotate-180", cityInput ? "text-white" : "text-gray-400")} />
          </button>
          
          {/* Location Dropdown */}
          {openSection === "location" && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-xl z-50 w-[220px] animate-fade-in">
              <div className="space-y-3">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={cityInputRef}
                    type="text"
                    placeholder="Stadt eingeben..."
                    value={cityInput}
                    onChange={(e) => handleCityInputChange(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 text-sm text-gray-900 border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                
                {filteredCities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCitySelect(city)}
                      className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          cityInput === city
                            ? "bg-amber-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}

                {cityInput && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Umkreis</span>
                      <span className="text-xs font-semibold text-gray-900">{radius[0]} km</span>
                    </div>
                    <Slider value={radius} onValueChange={handleRadiusChange} max={100} step={5} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={cn("w-px self-stretch my-3 transition-colors", (cityInput || selectedDate || selectedTimePill) ? "bg-transparent" : "bg-gray-200")} />

        {/* Datum */}
        <div className="relative flex-1 min-w-0 h-14">
          <button
            onClick={() => toggleSection("date")}
            className={cn(
              "flex items-center gap-3 px-5 h-full transition-colors w-full",
              (selectedDate || selectedTimePill)
                ? "bg-amber-700 text-white"
                : "bg-white",
              openSection === "date" && !(selectedDate || selectedTimePill) && "bg-gray-50",
              !(selectedDate || selectedTimePill) && openSection !== "date" && "hover:bg-gray-50"
            )}
          >
            <CalendarIcon className={cn("w-5 h-5 flex-shrink-0", (selectedDate || selectedTimePill) ? "text-white" : "text-gray-400")} />
            <span className={cn("font-medium text-sm truncate", (selectedDate || selectedTimePill) ? "text-white" : "text-gray-900")}>
              {getDateDisplayText()}
            </span>
            {(selectedDate || selectedTimePill) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(undefined);
                  setSelectedTimePill(null);
                  onDateChange(undefined);
                  onTimeChange(null);
                }}
                className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            ) : (
              <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", openSection === "date" && "rotate-180", "text-gray-400")} />
            )}
          </button>
          
          {/* Date Dropdown */}
          {openSection === "date" && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl shadow-xl z-50 animate-fade-in">
              <div className="space-y-3">
                {/* Time Pills - 2 per row */}
                <div className="grid grid-cols-2 gap-2">
                  {timePills.map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => handleTimePillClick(pill.id)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all text-center flex items-center justify-center gap-1.5",
                        selectedTimePill === pill.id
                          ? "bg-amber-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {pill.id === "now" && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                      {pill.label}
                    </button>
                  ))}
                </div>
                
                {/* Calendar */}
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    locale={de}
                    className="p-2 pointer-events-auto"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={cn("w-px self-stretch my-3 transition-colors", (selectedDate || selectedTimePill) ? "bg-transparent" : "bg-gray-200")} />

        {/* Suche Input mit Vorschlägen */}
        <div ref={searchContainerRef} className="relative flex items-center gap-3 px-5 h-14 flex-1 min-w-0 bg-white rounded-r-2xl">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Konzert, Festival, Ort..."
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchBlur}
            onFocus={handleSearchFocus}
            className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              {loadingSuggestions ? (
                <div className="px-4 py-3 text-sm text-gray-500">Suche...</div>
              ) : searchSuggestions.length > 0 ? (
                <div className="py-1">
                  {searchInput.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400 font-medium uppercase tracking-wide">Beliebte Events</div>
                  )}
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{suggestion.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">Keine Ergebnisse</div>
              )}
            </div>
          )}
        </div>

        {/* SUCHEN Button - Dunkelblau */}
        <div className="p-2 flex-shrink-0">
          <button
            onClick={() => onSearchChange(searchInput)}
            className="h-full px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>SUCHEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingsFilterBar;
