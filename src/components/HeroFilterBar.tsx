import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutGrid, 
  Smile, 
  MapPin, 
  Calendar as CalendarIcon, 
  Search,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { swissPlaces } from "@/utils/swissPlaces";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Kategorien mit Icons
const categories = [
  { id: null, slug: null, name: "Alle Kategorien", icon: LayoutGrid },
  { id: 1, slug: "musik-party", name: "Musik & Party", icon: Music },
  { id: 2, slug: "kunst-kultur", name: "Kunst & Kultur", icon: Palette },
  { id: 3, slug: "kulinarik-genuss", name: "Kulinarik & Genuss", icon: UtensilsCrossed },
  { id: 4, slug: "natur-ausfluege", name: "Natur & Ausflüge", icon: Sparkles },
  { id: 5, slug: "maerkte-stadtfeste", name: "Märkte & Stadtfeste", icon: Gift },
];

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
  { id: "tomorrow", label: "Morgen" },
  { id: "thisWeek", label: "Wochenende" },
  { id: "thisMonth", label: "Dieser Monat" },
];

// City suggestions for autocomplete
const citySuggestions = swissPlaces.slice(0, 50).map(p => p.name);

const HeroFilterBar = () => {
  const navigate = useNavigate();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [cityInput, setCityInput] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [radius, setRadius] = useState([25]);
  const [showRadius, setShowRadius] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimePill, setSelectedTimePill] = useState<string | null>(null);
  
  // Dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  
  const cityInputRef = useRef<HTMLInputElement>(null);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);

  // Filter city suggestions
  const filteredCities = citySuggestions.filter(city =>
    city.toLowerCase().includes(cityInput.toLowerCase())
  ).slice(0, 8);

  // Handle city selection
  const handleCitySelect = (city: string) => {
    setCityInput(city);
    setShowCitySuggestions(false);
    setShowRadius(true);
  };

  // Handle city input change
  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setShowCitySuggestions(value.length > 0);
    if (value.length > 0) {
      setShowRadius(true);
    }
  };

  // Handle time pill click
  const handleTimePillClick = (pillId: string) => {
    setSelectedTimePill(prev => prev === pillId ? null : pillId);
    setSelectedDate(undefined);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimePill(null);
    setDateOpen(false);
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

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (selectedCategory.slug) {
      params.set("category", selectedCategory.slug);
    }
    if (selectedMood.slug) {
      params.set("quickFilter", selectedMood.slug);
    }
    if (cityInput) {
      params.set("city", cityInput);
      if (radius[0] > 0) {
        params.set("radius", radius[0].toString());
      }
    }
    if (selectedTimePill) {
      params.set("time", selectedTimePill);
    }
    if (selectedDate) {
      params.set("date", selectedDate.toISOString());
    }
    
    navigate(`/listings?${params.toString()}`);
  };

  // Get date display text
  const getDateDisplayText = () => {
    if (selectedDate) {
      return format(selectedDate, "d. MMM", { locale: de });
    }
    if (selectedTimePill) {
      return timePills.find(p => p.id === selectedTimePill)?.label || "Jederzeit";
    }
    return "Jederzeit";
  };

  return (
    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-10 w-full px-4 md:px-6">
      {/* Glassmorphism Container */}
      <div className="backdrop-blur-xl bg-white/25 border border-white/40 rounded-2xl lg:rounded-full p-3 md:p-4 lg:px-6 lg:py-3 shadow-2xl mx-auto w-fit max-w-full">
        
        {/* Mobile: Stacked Layout */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-2">
          
          {/* Row 1 on mobile: Category & Mood */}
          <div className="flex gap-2 lg:contents">
            
            {/* Kategorie Dropdown */}
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <button className="flex-1 lg:flex-none lg:min-w-[160px] px-4 py-2.5 rounded-xl lg:rounded-full bg-white/90 border border-white/60 hover:bg-white transition-all flex items-center justify-between gap-2 text-sm font-medium text-foreground/80">
                  <div className="flex items-center gap-2">
                    <selectedCategory.icon size={16} className="text-foreground/60" />
                    <span className="truncate">{selectedCategory.name}</span>
                  </div>
                  <ChevronDown size={14} className={cn("transition-transform", categoryOpen && "rotate-180")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 bg-white border shadow-xl rounded-xl z-50" align="start">
                {categories.map((cat) => (
                  <button
                    key={cat.slug || "all"}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      selectedCategory.slug === cat.slug 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "hover:bg-muted text-foreground/80"
                    )}
                  >
                    <cat.icon size={18} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Stimmung Dropdown */}
            <Popover open={moodOpen} onOpenChange={setMoodOpen}>
              <PopoverTrigger asChild>
                <button className="flex-1 lg:flex-none lg:min-w-[150px] px-4 py-2.5 rounded-xl lg:rounded-full bg-white/90 border border-white/60 hover:bg-white transition-all flex items-center justify-between gap-2 text-sm font-medium text-foreground/80">
                  <div className="flex items-center gap-2">
                    <selectedMood.icon size={16} className="text-foreground/60" />
                    <span className="truncate">{selectedMood.name}</span>
                  </div>
                  <ChevronDown size={14} className={cn("transition-transform", moodOpen && "rotate-180")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 bg-white border shadow-xl rounded-xl z-50 max-h-80 overflow-y-auto" align="start">
                {moods.map((mood) => (
                  <button
                    key={mood.slug || "all"}
                    onClick={() => {
                      setSelectedMood(mood);
                      setMoodOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      selectedMood.slug === mood.slug 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "hover:bg-muted text-foreground/80"
                    )}
                  >
                    <mood.icon size={18} />
                    <span>{mood.name}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Divider - Desktop only */}
          <div className="hidden lg:block w-px h-8 bg-foreground/10" />

          {/* Row 2 on mobile: City Input with Radius */}
          <div className="relative flex-1 lg:min-w-[180px]">
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
              <input
                ref={cityInputRef}
                type="text"
                placeholder="Stadt (Optional)"
                value={cityInput}
                onChange={(e) => handleCityInputChange(e.target.value)}
                onFocus={() => cityInput.length > 0 && setShowCitySuggestions(true)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl lg:rounded-full bg-white/90 border border-white/60 text-sm placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
              />
            </div>
            
            {/* City Suggestions Dropdown */}
            {showCitySuggestions && filteredCities.length > 0 && (
              <div 
                ref={citySuggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border shadow-xl rounded-xl z-50 overflow-hidden"
              >
                {filteredCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <MapPin size={14} className="text-foreground/40" />
                    {city}
                  </button>
                ))}
              </div>
            )}
            
            {/* Radius Slider - appears when city is selected */}
            {showRadius && cityInput && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border shadow-xl rounded-xl z-40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-foreground/60 font-medium">Umkreis</span>
                  <span className="text-sm font-semibold">{radius[0]} km</span>
                </div>
                <Slider 
                  value={radius} 
                  onValueChange={setRadius} 
                  max={100} 
                  step={5} 
                  className="w-full"
                />
                <button 
                  onClick={() => setShowRadius(false)}
                  className="mt-3 w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Übernehmen
                </button>
              </div>
            )}
          </div>

          {/* Divider - Desktop only */}
          <div className="hidden lg:block w-px h-8 bg-foreground/10" />

          {/* Row 3 on mobile: Date Picker */}
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button className="flex-1 lg:flex-none lg:min-w-[130px] px-4 py-2.5 rounded-xl lg:rounded-full bg-white/90 border border-white/60 hover:bg-white transition-all flex items-center justify-between gap-2 text-sm font-medium text-foreground/80">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-foreground/60" />
                  <span>{getDateDisplayText()}</span>
                </div>
                <ChevronDown size={14} className={cn("transition-transform", dateOpen && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border shadow-xl rounded-xl z-50" align="start">
              <div className="p-3 border-b">
                <div className="flex flex-wrap gap-2">
                  {timePills.map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => {
                        handleTimePillClick(pill.id);
                        setDateOpen(false);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2",
                        selectedTimePill === pill.id
                          ? "bg-blue-900 text-white border-blue-900"
                          : "bg-transparent border-amber-400 text-foreground/70 hover:bg-amber-50"
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={de}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="lg:ml-2 px-6 py-2.5 rounded-xl lg:rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Search size={16} />
            <span>SUCHEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroFilterBar;
