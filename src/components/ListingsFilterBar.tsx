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
  Gem,
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
    Array<{ id: number | null; slug: string | null; name: string; icon: any }>
  >([{ id: null, slug: null, name: "Alle Kategorien", icon: LayoutGrid }]);
  const [selectedTimePill, setSelectedTimePill] = useState<string | null>(initialTime || null);
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);

  const isAnyDropdownOpen = () => categoryOpen || moodOpen || dateOpen || showCitySuggestions || radiusOpen;

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
    setRadiusOpen(true);
    onCityChange(city);
  };

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setShowCitySuggestions(value.length > 0);
    onCityChange(value);
    if (value.length > 0) setRadiusOpen(true);
  };

  const handleTimePillClick = (pillId: string) => {
    const newValue = selectedTimePill === pillId ? null : pillId;
    setSelectedTimePill(newValue);
    setSelectedDate(undefined);
    onTimeChange(newValue);
    onDateChange(undefined);
    setDateOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimePill(null);
    onDateChange(date);
    onTimeChange(null);
    setDateOpen(false);
  };

  const handleCategorySelect = (cat: (typeof categories)[0]) => {
    setSelectedCategory(cat);
    onCategoryChange(cat.id, cat.slug);
    setCategoryOpen(false);
  };

  const handleMoodSelect = (mood: (typeof moods)[0]) => {
    setSelectedMood(mood);
    onMoodChange(mood.slug);
    setMoodOpen(false);
  };

  const handleRadiusChange = (value: number[]) => {
    setRadius(value);
    onRadiusChange(value[0]);
  };

  const closeAllDropdowns = () => {
    setCategoryOpen(false);
    setMoodOpen(false);
    setDateOpen(false);
    setRadiusOpen(false);
    setShowCitySuggestions(false);
  };

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
        setCategories([{ id: null, slug: null, name: "Alle Kategorien", icon: LayoutGrid }, ...loadedCategories]);
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

  const getDateDisplayText = () => {
    if (selectedDate) return format(selectedDate, "d. MMM", { locale: de });
    if (selectedTimePill) return timePills.find((p) => p.id === selectedTimePill)?.label || "Jederzeit";
    return "Jederzeit";
  };

  return (
    <div className="w-full mb-10">
      {/* Premium Editorial Header */}
      <div className="relative">
        {/* Decorative Line */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        
        {/* Main Filter Container */}
        <div className="pt-8 pb-6">
          {/* Premium Label */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/60" />
            <div className="flex items-center gap-2 text-gold">
              <Gem size={14} className="animate-pulse" />
              <span className="text-[11px] font-medium tracking-[0.25em] uppercase">Kuratierte Auswahl</span>
              <Gem size={14} className="animate-pulse" />
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/60" />
          </div>

          {/* Filter Pills - Elegant Horizontal Layout */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {/* Kategorie */}
            <button
              onClick={() => {
                setCategoryOpen(!categoryOpen);
                setMoodOpen(false);
                setDateOpen(false);
              }}
              className={cn(
                "group relative px-5 py-3 transition-all duration-300 flex items-center gap-2.5",
                "border-b-2 hover:border-gold/60",
                categoryOpen ? "border-gold" : "border-transparent"
              )}
            >
              <selectedCategory.icon 
                size={16} 
                className={cn(
                  "transition-colors duration-300",
                  categoryOpen ? "text-gold" : "text-muted-foreground group-hover:text-foreground"
                )} 
              />
              <span className={cn(
                "font-serif text-sm tracking-wide transition-colors duration-300",
                categoryOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {selectedCategory.name}
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  "transition-all duration-300 ml-1",
                  categoryOpen ? "rotate-180 text-gold" : "text-muted-foreground"
                )}
              />
            </button>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-6 bg-border/50" />

            {/* Stimmung */}
            <button
              onClick={() => {
                setMoodOpen(!moodOpen);
                setCategoryOpen(false);
                setDateOpen(false);
              }}
              className={cn(
                "group relative px-5 py-3 transition-all duration-300 flex items-center gap-2.5",
                "border-b-2 hover:border-gold/60",
                moodOpen ? "border-gold" : "border-transparent"
              )}
            >
              <selectedMood.icon 
                size={16} 
                className={cn(
                  "transition-colors duration-300",
                  moodOpen ? "text-gold" : "text-muted-foreground group-hover:text-foreground"
                )} 
              />
              <span className={cn(
                "font-serif text-sm tracking-wide transition-colors duration-300",
                moodOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {selectedMood.name}
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  "transition-all duration-300 ml-1",
                  moodOpen ? "rotate-180 text-gold" : "text-muted-foreground"
                )}
              />
            </button>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-6 bg-border/50" />

            {/* Stadt Input - Premium Style */}
            <div className="relative group">
              <MapPin 
                size={14} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors duration-300 pointer-events-none" 
              />
              <input
                ref={cityInputRef}
                type="text"
                placeholder="Ort wählen"
                value={cityInput}
                onChange={(e) => handleCityInputChange(e.target.value)}
                onFocus={() => cityInput.length > 0 && setShowCitySuggestions(true)}
                className={cn(
                  "w-32 md:w-40 pl-10 pr-4 py-3 bg-transparent",
                  "font-serif text-sm tracking-wide text-foreground placeholder:text-muted-foreground/60",
                  "border-b-2 border-transparent focus:border-gold outline-none",
                  "transition-all duration-300"
                )}
              />
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-6 bg-border/50" />

            {/* Datum */}
            <button
              onClick={() => {
                setDateOpen(!dateOpen);
                setCategoryOpen(false);
                setMoodOpen(false);
              }}
              className={cn(
                "group relative px-5 py-3 transition-all duration-300 flex items-center gap-2.5",
                "border-b-2 hover:border-gold/60",
                dateOpen ? "border-gold" : "border-transparent"
              )}
            >
              <CalendarIcon 
                size={16} 
                className={cn(
                  "transition-colors duration-300",
                  dateOpen ? "text-gold" : "text-muted-foreground group-hover:text-foreground"
                )} 
              />
              <span className={cn(
                "font-serif text-sm tracking-wide transition-colors duration-300",
                dateOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {getDateDisplayText()}
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  "transition-all duration-300 ml-1",
                  dateOpen ? "rotate-180 text-gold" : "text-muted-foreground"
                )}
              />
            </button>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-6 bg-border/50" />

            {/* Premium Search */}
            <div className="relative flex items-center">
              <div className="relative group">
                <Search 
                  size={14} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors duration-300 pointer-events-none" 
                />
                <input
                  type="text"
                  placeholder="Suche..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={handleSearchBlur}
                  className={cn(
                    "w-36 md:w-48 pl-10 pr-4 py-3 bg-transparent",
                    "font-serif text-sm tracking-wide text-foreground placeholder:text-muted-foreground/60",
                    "border-b-2 border-transparent focus:border-gold outline-none",
                    "transition-all duration-300"
                  )}
                />
              </div>
              <button
                onClick={() => onSearchChange(searchInput)}
                className={cn(
                  "ml-2 px-4 py-2.5 rounded-full",
                  "bg-foreground text-background",
                  "font-sans text-xs font-semibold tracking-wide uppercase",
                  "hover:bg-gold hover:text-foreground",
                  "transition-all duration-300",
                  "flex items-center gap-2"
                )}
              >
                <Search size={12} />
                <span className="hidden md:inline">Finden</span>
              </button>
            </div>
          </div>

          {/* Active Filters Chips */}
          {(selectedCategory.slug || selectedMood.slug || cityInput || selectedDate || selectedTimePill || searchInput) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-6 border-t border-border/30">
              <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mr-2">Filter:</span>
              
              {selectedCategory.slug && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                  {selectedCategory.name}
                  <button onClick={() => handleCategorySelect(categories[0])} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </span>
              )}
              
              {selectedMood.slug && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                  {selectedMood.name}
                  <button onClick={() => handleMoodSelect(moods[0])} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </span>
              )}
              
              {cityInput && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                  <MapPin size={10} /> {cityInput} ({radius[0]} km)
                  <button onClick={() => { setCityInput(""); onCityChange(""); setRadiusOpen(false); }} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </span>
              )}
              
              {(selectedDate || selectedTimePill) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                  <CalendarIcon size={10} /> {getDateDisplayText()}
                  <button onClick={() => { setSelectedDate(undefined); setSelectedTimePill(null); onDateChange(undefined); onTimeChange(null); }} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </span>
              )}
              
              {searchInput && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                  "{searchInput}"
                  <button onClick={() => { setSearchInput(""); onSearchChange(""); }} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Decorative Line */}
        <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Expandable Panels - Premium Style */}
      {isAnyDropdownOpen() && (
        <div className="mt-6 animate-fade-in">
          <div className="relative bg-secondary/50 backdrop-blur-sm rounded-2xl p-6 border border-border/30">
            {/* Close Button */}
            <button
              onClick={closeAllDropdowns}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            {/* Category Grid */}
            {categoryOpen && (
              <div>
                <h3 className="font-serif text-lg mb-5 text-foreground">Kategorie wählen</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug || "all"}
                      onClick={() => handleCategorySelect(cat)}
                      className={cn(
                        "group flex flex-col items-center gap-3 p-5 rounded-xl transition-all duration-300",
                        selectedCategory.slug === cat.slug
                          ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                          : "bg-background/80 hover:bg-background text-foreground hover:shadow-md border border-border/20 hover:border-gold/30"
                      )}
                    >
                      <cat.icon 
                        size={24} 
                        className={cn(
                          "transition-all duration-300",
                          selectedCategory.slug === cat.slug ? "text-gold-light" : "text-muted-foreground group-hover:text-gold"
                        )} 
                      />
                      <span className="font-serif text-xs text-center leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mood Grid */}
            {moodOpen && (
              <div>
                <h3 className="font-serif text-lg mb-5 text-foreground">Stimmung wählen</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.slug || "all"}
                      onClick={() => handleMoodSelect(mood)}
                      className={cn(
                        "group flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300",
                        selectedMood.slug === mood.slug
                          ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                          : "bg-background/80 hover:bg-background text-foreground hover:shadow-md border border-border/20 hover:border-gold/30"
                      )}
                    >
                      <mood.icon 
                        size={20} 
                        className={cn(
                          "transition-all duration-300",
                          selectedMood.slug === mood.slug ? "text-gold-light" : "text-muted-foreground group-hover:text-gold"
                        )} 
                      />
                      <span className="font-serif text-[10px] text-center leading-tight">{mood.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* City Suggestions */}
            {showCitySuggestions && filteredCities.length > 0 && (
              <div ref={citySuggestionsRef}>
                <h3 className="font-serif text-lg mb-5 text-foreground">Ort wählen</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className="group px-4 py-3 text-left bg-background/80 hover:bg-background rounded-xl transition-all duration-300 flex items-center gap-3 hover:shadow-md border border-border/20 hover:border-gold/30"
                    >
                      <MapPin size={14} className="text-muted-foreground group-hover:text-gold transition-colors" />
                      <span className="font-serif text-sm">{city}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Radius Slider */}
            {radiusOpen && cityInput && !showCitySuggestions && (
              <div className="max-w-md">
                <h3 className="font-serif text-lg mb-5 text-foreground">Umkreis: {cityInput}</h3>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={radius} 
                    onValueChange={handleRadiusChange} 
                    max={100} 
                    step={5} 
                    className="flex-1" 
                  />
                  <span className="font-serif text-lg font-medium text-gold min-w-[60px] text-right">
                    {radius[0]} km
                  </span>
                </div>
              </div>
            )}

            {/* Date Picker */}
            {dateOpen && (
              <div>
                <h3 className="font-serif text-lg mb-5 text-foreground">Zeitraum wählen</h3>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Quick Pills */}
                  <div className="flex flex-wrap gap-2">
                    {timePills.map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => handleTimePillClick(pill.id)}
                        className={cn(
                          "px-5 py-2.5 rounded-full font-serif text-sm transition-all duration-300",
                          selectedTimePill === pill.id
                            ? "bg-foreground text-background shadow-lg"
                            : "bg-background/80 hover:bg-background text-foreground border border-border/20 hover:border-gold/30 hover:shadow-md"
                        )}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Calendar */}
                  <div className="bg-background rounded-xl shadow-sm border border-border/20 overflow-hidden">
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsFilterBar;