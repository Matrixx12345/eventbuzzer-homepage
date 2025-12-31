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
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { swissPlaces } from "@/utils/swissPlaces";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Icon mapping
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
  { id: null, slug: null, name: "Alle", icon: Smile },
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
  { id: "thisMonth", label: "Monat" },
];

// City suggestions
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
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState({
    id: null as number | null,
    slug: null as string | null,
    name: "Alle",
    icon: LayoutGrid,
  });

  const [selectedMood, setSelectedMood] = useState(() => {
    if (initialMood) {
      return moods.find((m) => m.slug === initialMood) || moods[0];
    }
    return moods[0];
  });
  const [cityInput, setCityInput] = useState(initialCity || "");
  const [radius, setRadius] = useState([initialRadius]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [categories, setCategories] = useState<
    Array<{ id: number | null; slug: string | null; name: string; icon: any }>
  >([{ id: null, slug: null, name: "Alle", icon: LayoutGrid }]);
  const [selectedTimePill, setSelectedTimePill] = useState<string | null>(initialTime || null);
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Panel state - single expandable block
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearchChange(searchInput);
  };

  const handleSearchBlur = () => {
    if (searchInput.length >= 3 || searchInput.length === 0) onSearchChange(searchInput);
  };

  const filteredCities = citySuggestions
    .filter((city) => city.toLowerCase().includes(cityInput.toLowerCase()))
    .slice(0, 8);

  const handleCitySelect = (city: string) => {
    setCityInput(city);
    setShowCitySuggestions(false);
    onCityChange(city);
  };

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setShowCitySuggestions(value.length > 0);
    onCityChange(value);
  };

  const handleTimePillClick = (pillId: string) => {
    const newValue = selectedTimePill === pillId ? null : pillId;
    setSelectedTimePill(newValue);
    setSelectedDate(undefined);
    onTimeChange(newValue);
    onDateChange(undefined);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimePill(null);
    onDateChange(date);
    onTimeChange(null);
  };

  const handleCategorySelect = (cat: (typeof categories)[0]) => {
    setSelectedCategory(cat);
    onCategoryChange(cat.id, cat.slug);
  };

  const handleMoodSelect = (mood: (typeof moods)[0]) => {
    setSelectedMood(mood);
    onMoodChange(mood.slug);
  };

  const handleRadiusChange = (value: number[]) => {
    setRadius(value);
    onRadiusChange(value[0]);
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
    setShowCitySuggestions(false);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setShowCitySuggestions(false);
  };

  const clearAllFilters = () => {
    setSelectedCategory(categories[0]);
    setSelectedMood(moods[0]);
    setCityInput("");
    setRadius([25]);
    setSelectedDate(undefined);
    setSelectedTimePill(null);
    setSearchInput("");
    onCategoryChange(null, null);
    onMoodChange(null);
    onCityChange("");
    onRadiusChange(25);
    onTimeChange(null);
    onDateChange(undefined);
    onSearchChange("");
  };

  const hasActiveFilters = selectedCategory.slug || selectedMood.slug || cityInput || selectedDate || selectedTimePill || searchInput;

  // Effects
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

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategory.slug) count++;
    if (selectedMood.slug) count++;
    if (cityInput) count++;
    if (selectedDate || selectedTimePill) count++;
    if (searchInput) count++;
    return count;
  };

  const getDateDisplayText = () => {
    if (selectedDate) return format(selectedDate, "d. MMM", { locale: de });
    if (selectedTimePill) return timePills.find((p) => p.id === selectedTimePill)?.label || "";
    return "";
  };

  return (
    <div className="w-full mb-8">
      {/* Compact Trigger Bar */}
      <div className="flex items-center gap-3">
        {/* Main Filter Toggle */}
        <button
          onClick={togglePanel}
          className={cn(
            "group flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300",
            "bg-foreground text-background hover:bg-foreground/90",
            isPanelOpen && "ring-2 ring-foreground/20 ring-offset-2 ring-offset-background"
          )}
        >
          <SlidersHorizontal size={16} className="transition-transform duration-300 group-hover:rotate-12" />
          <span className="font-medium text-sm">Filter</span>
          {getActiveFilterCount() > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-background text-foreground text-xs font-bold">
              {getActiveFilterCount()}
            </span>
          )}
          <ChevronDown 
            size={14} 
            className={cn(
              "transition-transform duration-300",
              isPanelOpen && "rotate-180"
            )} 
          />
        </button>

        {/* Quick Time Pills */}
        <div className="hidden md:flex items-center gap-1.5">
          {timePills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleTimePillClick(pill.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                selectedTimePill === pill.id
                  ? "bg-foreground text-background"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-xs relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchBlur}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-full",
              "bg-secondary text-foreground placeholder:text-muted-foreground",
              "text-sm font-medium",
              "border-2 border-transparent focus:border-foreground/20 outline-none",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="p-2.5 rounded-full bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && !isPanelOpen && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {selectedCategory.slug && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full text-xs font-medium">
              <selectedCategory.icon size={12} />
              {selectedCategory.name}
              <button onClick={() => handleCategorySelect(categories[0])} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          )}
          {selectedMood.slug && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full text-xs font-medium">
              <selectedMood.icon size={12} />
              {selectedMood.name}
              <button onClick={() => handleMoodSelect(moods[0])} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          )}
          {cityInput && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full text-xs font-medium">
              <MapPin size={12} />
              {cityInput} · {radius[0]}km
              <button onClick={() => { setCityInput(""); onCityChange(""); }} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          )}
          {(selectedDate || selectedTimePill) && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full text-xs font-medium">
              <CalendarIcon size={12} />
              {getDateDisplayText()}
              <button onClick={() => { setSelectedDate(undefined); setSelectedTimePill(null); onDateChange(undefined); onTimeChange(null); }} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          )}
          {searchInput && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full text-xs font-medium">
              <Search size={12} />
              "{searchInput}"
              <button onClick={() => { setSearchInput(""); onSearchChange(""); }} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Expandable Filter Panel */}
      <div
        ref={panelRef}
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isPanelOpen ? "max-h-[800px] opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"
        )}
      >
        <div className="bg-secondary/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-border/30 relative">
          {/* Close Button */}
          <button
            onClick={closePanel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>

          <div className="space-y-8">
            {/* Kategorien */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Kategorie</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.slug || "all"}
                    onClick={() => handleCategorySelect(cat)}
                    className={cn(
                      "group flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200",
                      selectedCategory.slug === cat.slug
                        ? "bg-foreground text-background"
                        : "bg-background hover:bg-foreground/5 text-foreground border border-border/40"
                    )}
                  >
                    <cat.icon size={14} />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stimmung */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Stimmung</h3>
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.slug || "all"}
                    onClick={() => handleMoodSelect(mood)}
                    className={cn(
                      "group flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200",
                      selectedMood.slug === mood.slug
                        ? "bg-foreground text-background"
                        : "bg-background hover:bg-foreground/5 text-foreground border border-border/40"
                    )}
                  >
                    <mood.icon size={14} />
                    <span className="text-sm font-medium">{mood.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ort & Umkreis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Ort</h3>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    ref={cityInputRef}
                    type="text"
                    placeholder="Stadt eingeben..."
                    value={cityInput}
                    onChange={(e) => handleCityInputChange(e.target.value)}
                    onFocus={() => cityInput.length > 0 && setShowCitySuggestions(true)}
                    className={cn(
                      "w-full pl-11 pr-4 py-3 rounded-2xl",
                      "bg-background text-foreground placeholder:text-muted-foreground",
                      "text-sm font-medium",
                      "border border-border/40 focus:border-foreground/30 outline-none",
                      "transition-all duration-200"
                    )}
                  />
                  {/* City Suggestions */}
                  {showCitySuggestions && filteredCities.length > 0 && (
                    <div 
                      ref={citySuggestionsRef}
                      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/40 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      {filteredCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-3 text-sm text-left hover:bg-foreground/5 transition-colors flex items-center gap-3"
                        >
                          <MapPin size={14} className="text-muted-foreground" />
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {cityInput && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                    Umkreis: <span className="text-foreground">{radius[0]} km</span>
                  </h3>
                  <div className="pt-2">
                    <Slider 
                      value={radius} 
                      onValueChange={handleRadiusChange} 
                      max={100} 
                      step={5} 
                      className="w-full" 
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>0 km</span>
                      <span>100 km</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Datum */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Zeitraum</h3>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Quick Time Pills */}
                <div className="flex flex-wrap gap-2">
                  {timePills.map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => handleTimePillClick(pill.id)}
                      className={cn(
                        "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                        selectedTimePill === pill.id
                          ? "bg-foreground text-background"
                          : "bg-background hover:bg-foreground/5 text-foreground border border-border/40"
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Calendar */}
                <div className="bg-background rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    locale={de}
                    className="p-3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Alle zurücksetzen
            </button>
            <button
              onClick={closePanel}
              className={cn(
                "px-8 py-3 rounded-full",
                "bg-foreground text-background",
                "text-sm font-semibold",
                "hover:bg-foreground/90 transition-all duration-200",
                "flex items-center gap-2"
              )}
            >
              <Search size={16} />
              Ergebnisse anzeigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsFilterBar;
