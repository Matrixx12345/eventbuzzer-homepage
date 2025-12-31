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

const timePills = [
  { id: "now", label: "Jetzt" },
  { id: "today", label: "Heute" },
  { id: "thisWeek", label: "Wochenende" },
  { id: "thisMonth", label: "Monat" },
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

  // Which dropdown is open
  const [openSection, setOpenSection] = useState<"category" | "mood" | "location" | "date" | null>(null);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCities = citySuggestions
    .filter((city) => city.toLowerCase().includes(cityInput.toLowerCase()))
    .slice(0, 6);

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
    <div ref={containerRef} className="w-full mb-8">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-secondary/80 backdrop-blur-sm rounded-2xl border border-border/30">
        {/* Kategorie */}
        <button
          onClick={() => toggleSection("category")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            openSection === "category" || selectedCategory.slug
              ? "bg-foreground text-background"
              : "bg-background/60 hover:bg-background text-foreground"
          )}
        >
          <selectedCategory.icon size={16} />
          <span>{selectedCategory.slug ? selectedCategory.name : "Kategorie"}</span>
          <ChevronDown size={14} className={cn("transition-transform", openSection === "category" && "rotate-180")} />
        </button>

        {/* Stimmung */}
        <button
          onClick={() => toggleSection("mood")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            openSection === "mood" || selectedMood.slug
              ? "bg-foreground text-background"
              : "bg-background/60 hover:bg-background text-foreground"
          )}
        >
          <selectedMood.icon size={16} />
          <span>{selectedMood.slug ? selectedMood.name : "Stimmung"}</span>
          <ChevronDown size={14} className={cn("transition-transform", openSection === "mood" && "rotate-180")} />
        </button>

        {/* Ort */}
        <button
          onClick={() => toggleSection("location")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            openSection === "location" || cityInput
              ? "bg-foreground text-background"
              : "bg-background/60 hover:bg-background text-foreground"
          )}
        >
          <MapPin size={16} />
          <span>{cityInput || "Ort"}</span>
          <ChevronDown size={14} className={cn("transition-transform", openSection === "location" && "rotate-180")} />
        </button>

        {/* Datum */}
        <button
          onClick={() => toggleSection("date")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            openSection === "date" || selectedDate || selectedTimePill
              ? "bg-foreground text-background"
              : "bg-background/60 hover:bg-background text-foreground"
          )}
        >
          <CalendarIcon size={16} />
          <span>{getDateDisplayText()}</span>
          <ChevronDown size={14} className={cn("transition-transform", openSection === "date" && "rotate-180")} />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchBlur}
            className="w-32 md:w-44 pl-9 pr-3 py-2.5 rounded-xl bg-background/60 text-sm placeholder:text-muted-foreground border-0 outline-none focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Expandable Panel */}
      {openSection && (
        <div className="mt-3 p-5 bg-secondary/60 backdrop-blur-md rounded-2xl border border-border/30 animate-fade-in">
          {/* Category */}
          {openSection === "category" && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug || "all"}
                  onClick={() => handleCategorySelect(cat)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    selectedCategory.slug === cat.slug
                      ? "bg-foreground text-background"
                      : "bg-background hover:bg-background/80 text-foreground border border-border/40"
                  )}
                >
                  <cat.icon size={16} />
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Mood */}
          {openSection === "mood" && (
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.slug || "all"}
                  onClick={() => handleMoodSelect(mood)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    selectedMood.slug === mood.slug
                      ? "bg-foreground text-background"
                      : "bg-background hover:bg-background/80 text-foreground border border-border/40"
                  )}
                >
                  <mood.icon size={16} />
                  {mood.name}
                </button>
              ))}
            </div>
          )}

          {/* Location */}
          {openSection === "location" && (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={cityInputRef}
                  type="text"
                  placeholder="Stadt eingeben..."
                  value={cityInput}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background text-sm border border-border/40 outline-none focus:border-foreground/30"
                />
              </div>
              
              {filteredCities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        cityInput === city
                          ? "bg-foreground text-background"
                          : "bg-background hover:bg-background/80 text-foreground border border-border/40"
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}

              {cityInput && (
                <div className="pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Umkreis</span>
                    <span className="text-sm font-semibold">{radius[0]} km</span>
                  </div>
                  <Slider value={radius} onValueChange={handleRadiusChange} max={100} step={5} />
                </div>
              )}
            </div>
          )}

          {/* Date - Pills appear here */}
          {openSection === "date" && (
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex flex-wrap gap-2">
                {timePills.map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => handleTimePillClick(pill.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                      selectedTimePill === pill.id
                        ? "bg-foreground text-background"
                        : "bg-background hover:bg-background/80 text-foreground border border-border/40"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <div className="bg-background rounded-xl border border-border/40 overflow-hidden">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={de}
                  className="p-3"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListingsFilterBar;
