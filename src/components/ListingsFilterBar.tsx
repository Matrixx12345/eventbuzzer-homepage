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
    <div ref={containerRef} className="w-full">
      {/* Main Filter Bar - White bar with dark text */}
      <div className="flex items-stretch bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Kategorie */}
        <button
          onClick={() => toggleSection("category")}
          className={cn(
            "flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 flex-1 min-w-0",
            openSection === "category" && "bg-gray-50"
          )}
        >
          <LayoutGrid className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900 text-sm truncate">
            {selectedCategory.slug ? selectedCategory.name : "Alle Kategorien"}
          </span>
        </button>

        <div className="w-px bg-gray-200 self-stretch my-3" />

        {/* Stimmung */}
        <button
          onClick={() => toggleSection("mood")}
          className={cn(
            "flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 flex-1 min-w-0",
            openSection === "mood" && "bg-gray-50"
          )}
        >
          <Smile className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900 text-sm truncate">
            {selectedMood.slug ? selectedMood.name : "Jede Stimmung"}
          </span>
        </button>

        <div className="w-px bg-gray-200 self-stretch my-3" />

        {/* Ort */}
        <button
          onClick={() => toggleSection("location")}
          className={cn(
            "flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 flex-1 min-w-0",
            openSection === "location" && "bg-gray-50"
          )}
        >
          <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="text-left min-w-0">
            <div className="font-medium text-gray-900 text-sm truncate">
              {cityInput || "Ort"}
            </div>
            {!cityInput && (
              <div className="text-xs text-gray-400">Ort eingeben</div>
            )}
          </div>
        </button>

        <div className="w-px bg-gray-200 self-stretch my-3" />

        {/* Datum */}
        <button
          onClick={() => toggleSection("date")}
          className={cn(
            "flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 flex-1 min-w-0",
            openSection === "date" && "bg-gray-50"
          )}
        >
          <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900 text-sm truncate">
            {getDateDisplayText()}
          </span>
        </button>

        <div className="w-px bg-gray-200 self-stretch my-3" />

        {/* Suche Input */}
        <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="text-left min-w-0 w-full">
            <input
              type="text"
              placeholder="Suchen"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={handleSearchBlur}
              className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none"
            />
            {!searchInput && (
              <div className="text-xs text-gray-400">Event suchen</div>
            )}
          </div>
        </div>

        {/* SUCHEN Button */}
        <div className="p-2 flex-shrink-0">
          <button
            onClick={() => onSearchChange(searchInput)}
            className="h-full px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>SUCHEN</span>
          </button>
        </div>
      </div>

      {/* Expandable Panel */}
      {openSection && (
        <div className="mt-3 p-5 bg-white rounded-2xl shadow-xl animate-fade-in">
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
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
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
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
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
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={cityInputRef}
                  type="text"
                  placeholder="Stadt eingeben..."
                  value={cityInput}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-sm text-gray-900 border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}

              {cityInput && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">Umkreis</span>
                    <span className="text-sm font-semibold text-gray-900">{radius[0]} km</span>
                  </div>
                  <Slider value={radius} onValueChange={handleRadiusChange} max={100} step={5} />
                </div>
              )}
            </div>
          )}

          {/* Date */}
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
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl overflow-hidden">
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
