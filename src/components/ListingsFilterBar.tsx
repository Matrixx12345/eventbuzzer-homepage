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
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { swissPlaces } from "@/utils/swissPlaces";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import filterBg from "@/assets/filter-bg.jpg";

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
  // Callbacks
  onCategoryChange: (categoryId: number | null, categorySlug: string | null) => void;
  onMoodChange: (moodSlug: string | null) => void;
  onCityChange: (city: string) => void;
  onRadiusChange: (radius: number) => void;
  onTimeChange: (time: string | null) => void;
  onDateChange: (date: Date | undefined) => void;
}

const ListingsFilterBar = ({
  initialCategory,
  initialMood,
  initialCity,
  initialRadius = 25,
  initialTime,
  initialDate,
  onCategoryChange,
  onMoodChange,
  onCityChange,
  onRadiusChange,
  onTimeChange,
  onDateChange,
}: ListingsFilterBarProps) => {
  // Collapsed state
  const [isExpanded, setIsExpanded] = useState(true);

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

  // Dropdown states for inline expansion
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);

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

  // Summary for collapsed state
  const getFilterSummary = () => {
    const parts: string[] = [];
    if (selectedCategory.id) parts.push(selectedCategory.name);
    if (selectedMood.id) parts.push(selectedMood.name);
    if (cityInput) parts.push(cityInput);
    if (selectedTimePill || selectedDate) parts.push(getDateDisplayText());
    return parts.length > 0 ? parts.join(" • ") : "Alle Events";
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl mb-6">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={filterBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Collapsed Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-white/25 border-b border-white/20"
        >
          <div className="flex items-center gap-3">
            <span className="text-white/90 font-medium text-sm">{getFilterSummary()}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <span className="text-xs font-medium">{isExpanded ? "Einklappen" : "Filter anpassen"}</span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 md:p-6">
            {/* Glassmorphism Container */}
            <div className="backdrop-blur-xl bg-white/25 border border-white/40 rounded-2xl p-4 md:p-6 shadow-xl">
              {/* Filter Pills Row */}
              <div className="flex flex-wrap gap-3 mb-4">
                {/* Kategorie Button */}
                <button
                  onClick={() => {
                    setCategoryOpen(!categoryOpen);
                    setMoodOpen(false);
                    setDateOpen(false);
                  }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl bg-white/90 border border-white/60 hover:bg-white transition-all flex items-center gap-2 text-sm font-medium",
                    categoryOpen ? "ring-2 ring-primary/50" : "",
                  )}
                >
                  <selectedCategory.icon size={16} className="text-foreground/60" />
                  <span className="text-foreground/80">{selectedCategory.name}</span>
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform text-foreground/60", categoryOpen && "rotate-180")}
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
                    "px-4 py-2.5 rounded-xl bg-white/90 border border-white/60 hover:bg-white transition-all flex items-center gap-2 text-sm font-medium",
                    moodOpen ? "ring-2 ring-primary/50" : "",
                  )}
                >
                  <selectedMood.icon size={16} className="text-foreground/60" />
                  <span className="text-foreground/80">{selectedMood.name}</span>
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform text-foreground/60", moodOpen && "rotate-180")}
                  />
                </button>

                {/* Stadt Input */}
                <div className="relative">
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
                    <input
                      ref={cityInputRef}
                      type="text"
                      placeholder="Stadt"
                      value={cityInput}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      onFocus={() => cityInput.length > 0 && setShowCitySuggestions(true)}
                      className="w-36 md:w-44 pl-9 pr-4 py-2.5 rounded-xl bg-white/90 border border-white/60 text-sm placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Datum Button */}
                <button
                  onClick={() => {
                    setDateOpen(!dateOpen);
                    setCategoryOpen(false);
                    setMoodOpen(false);
                  }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl bg-white/90 border border-white/60 hover:bg-white transition-all flex items-center gap-2 text-sm font-medium",
                    dateOpen ? "ring-2 ring-primary/50" : "",
                  )}
                >
                  <CalendarIcon size={16} className="text-foreground/60" />
                  <span className="text-foreground/80">{getDateDisplayText()}</span>
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform text-foreground/60", dateOpen && "rotate-180")}
                  />
                </button>

                {/* Aktualisieren Button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="ml-auto px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Check size={16} />
                  <span>Übernehmen</span>
                </button>
              </div>

              {/* Expandable Dropdowns - All in one glassmorphism block */}
              {(categoryOpen || moodOpen || dateOpen || showCitySuggestions || radiusOpen) && (
                <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-xl p-4 mt-2 shadow-lg">
                  {/* Category Dropdown */}
                  {categoryOpen && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.slug || "all"}
                          onClick={() => handleCategorySelect(cat)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                            selectedCategory.slug === cat.slug
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-white/80 hover:bg-white text-foreground/80 border border-white/60",
                          )}
                        >
                          <cat.icon size={24} />
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
                            "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                            selectedMood.slug === mood.slug
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-white/80 hover:bg-white text-foreground/80 border border-white/60",
                          )}
                        >
                          <mood.icon size={20} />
                          <span className="text-[11px] font-medium text-center leading-tight">{mood.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* City Suggestions */}
                  {showCitySuggestions && filteredCities.length > 0 && (
                    <div ref={citySuggestionsRef} className="space-y-1">
                      <p className="text-xs text-foreground/60 font-medium mb-2">Vorschläge</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {filteredCities.map((city) => (
                          <button
                            key={city}
                            onClick={() => handleCitySelect(city)}
                            className="px-4 py-2.5 text-sm text-left bg-white/80 hover:bg-white rounded-lg transition-colors flex items-center gap-2 border border-white/60"
                          >
                            <MapPin size={14} className="text-foreground/40" />
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
                        <span className="text-sm text-foreground/70 font-medium">Umkreis</span>
                        <span className="text-sm font-semibold bg-white/80 px-3 py-1 rounded-lg">{radius[0]} km</span>
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
                              "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                              selectedTimePill === pill.id
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-white/80 hover:bg-white text-foreground/70 border border-white/60",
                            )}
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>

                      {/* Calendar */}
                      <div className="bg-white rounded-xl shadow-sm">
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
        )}
      </div>
    </div>
  );
};

export default ListingsFilterBar;
