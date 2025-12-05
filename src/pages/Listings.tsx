import { useState } from "react";
import { 
  Heart, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Calendar as CalendarIcon, 
  Cake, 
  CloudRain, 
  UtensilsCrossed,
  Camera,
  Heart as HeartIcon,
  Smile,
  PartyPopper,
  Waves,
  Mountain,
  Search,
  CalendarDays
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
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
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { de } from "date-fns/locale";

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

// Sample events data
const allEvents = [
  { id: "einsiedeln-abbey", slug: "einsiedeln-abbey", image: eventAbbey, title: "Photo Spot Einsiedeln Abbey", venue: "Leonard House", location: "Einsiedeln", category: "Kultur", subcategory: "Foto-Spots", date: "15. Dez 2025", price: 0 },
  { id: "nordportal", slug: "nordportal", image: eventVenue, title: "Nordportal", venue: "Leonard House", location: "Baden", category: "Musik", subcategory: "Konzert", date: "20. Dez 2025", price: 25 },
  { id: "kulturbetrieb-royal", slug: "kulturbetrieb-royal", image: eventConcert, title: "Kulturbetrieb Royal", venue: "Leonard House", location: "Baden", category: "Musik", subcategory: "Konzert", date: "22. Dez 2025", price: 30 },
  { id: "zurich-tonhalle", slug: "zurich-tonhalle", image: eventSymphony, title: "Zurich Tonhalle", venue: "Tonhalle Orchestra", location: "Zürich", category: "Musik", subcategory: "Klassik", date: "28. Dez 2025", price: 45 },
  { id: "zurich-lights", slug: "zurich-lights", image: swissZurich, title: "Zurich Christmas Lights", venue: "Old Town", location: "Zürich", category: "Festival", subcategory: "Festival", date: "10. Dez 2025", price: 0 },
  { id: "bern-markets", slug: "bern-markets", image: swissBern, title: "Bern Christmas Markets", venue: "Bundesplatz", location: "Bern", category: "Kultur", subcategory: "Markt", date: "12. Dez 2025", price: 0 },
  { id: "lucerne-festival", slug: "lucerne-festival", image: swissLucerne, title: "Lucerne Light Festival", venue: "Chapel Bridge", location: "Luzern", category: "Festival", subcategory: "Festival", date: "5. Jan 2026", price: 15 },
  { id: "geneva-gala", slug: "geneva-gala", image: swissGeneva, title: "Geneva New Year Gala", venue: "Jet d'Eau", location: "Genf", category: "Nightlife", subcategory: "Gala", date: "31. Dez 2025", price: 85 },
  { id: "jazz-night", slug: "jazz-night", image: weekendJazz, title: "Jazz Night at Moods", venue: "Moods Club", location: "Zürich", category: "Musik", subcategory: "Jazz", date: "18. Dez 2025", price: 35 },
  { id: "opera-house", slug: "opera-house", image: weekendOpera, title: "La Traviata", venue: "Opera House", location: "Zürich", category: "Kultur", subcategory: "Oper", date: "10. Jan 2026", price: 120 },
];

// Quick filters with icons
const quickFilters = [
  { id: "geburtstag", label: "Geburtstag", icon: Cake },
  { id: "mistwetter", label: "Mistwetter", icon: CloudRain },
  { id: "streetfood", label: "Streetfood", icon: UtensilsCrossed },
  { id: "foto-spots", label: "Foto-Spots", icon: Camera },
  { id: "romantik", label: "Romantik", icon: HeartIcon },
  { id: "mit-kind", label: "Mit Kind", icon: Smile },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper },
  { id: "wellness", label: "Wellness", icon: Waves },
  { id: "natur", label: "Natur", icon: Mountain },
];

const priceFilters = [
  { id: "all", label: "Alle" },
  { id: "free", label: "Gratis" },
  { id: "under20", label: "< 20 €" },
  { id: "over20", label: "> 20 €" },
];

const cities = ["Zürich", "Bern", "Basel", "Luzern", "Genf", "Baden", "Winterthur", "St. Gallen"];

const categories = [
  { value: "all", label: "Alle Kategorien" },
  { value: "musik", label: "Musik" },
  { value: "kultur", label: "Kultur" },
  { value: "festival", label: "Festival" },
  { value: "nightlife", label: "Nightlife" },
  { value: "sport", label: "Sport" },
  { value: "kulinarik", label: "Kulinarik" },
];

const subcategories: Record<string, string[]> = {
  all: ["Festival", "Konzert", "Klassik", "Jazz", "Oper", "Markt", "Gala", "Foto-Spots"],
  musik: ["Konzert", "Klassik", "Jazz", "Rock", "Pop", "Electronic"],
  kultur: ["Oper", "Theater", "Museum", "Ausstellung", "Foto-Spots"],
  festival: ["Festival", "Markt", "Messe"],
  nightlife: ["Club", "Bar", "Gala", "Party"],
  sport: ["Fussball", "Hockey", "Tennis", "Laufen"],
  kulinarik: ["Restaurant", "Streetfood", "Weinprobe", "Kochkurs"],
};

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const getDateLabel = () => {
    if (!selectedDate) return null;
    if (isToday(selectedDate)) return "Heute";
    if (isTomorrow(selectedDate)) return "Morgen";
    return format(selectedDate, "d. MMM", { locale: de });
  };

  const toggleQuickFilter = (filterId: string) => {
    setSelectedQuickFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  };

  const toggleSubcategory = (sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub)
        ? prev.filter((s) => s !== sub)
        : [...prev, sub]
    );
  };

  // Filter events (simplified for demo)
  const filteredEvents = allEvents.filter((event) => {
    // Price filter
    if (selectedPrice === "free" && event.price > 0) return false;
    if (selectedPrice === "under20" && event.price >= 20) return false;
    if (selectedPrice === "over20" && event.price <= 20) return false;
    
    // Category filter
    if (selectedCategory !== "all" && event.category.toLowerCase() !== selectedCategory) return false;
    
    // Subcategory filter
    if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(event.subcategory)) return false;
    
    return true;
  });

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedQuickFilters([]);
    setSelectedPrice("all");
    setSelectedCity("");
    setRadius([0]);
    setSelectedCategory("all");
    setSelectedSubcategories([]);
  };

  const hasActiveFilters = 
    selectedDate !== undefined ||
    selectedQuickFilters.length > 0 ||
    selectedPrice !== "all" ||
    selectedCity !== "" ||
    radius[0] > 0 ||
    selectedCategory !== "all" ||
    selectedSubcategories.length > 0;

  const currentSubcategories = subcategories[selectedCategory] || subcategories.all;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Header - Just reset button when filters active */}
      {hasActiveFilters && (
        <div className="flex items-center justify-end">
          <button
            onClick={clearFilters}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Zurücksetzen
          </button>
        </div>
      )}

      {/* Datum (Date) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Datum</h3>
        <button 
          onClick={() => setShowCalendar(true)}
          className="w-full px-4 py-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-2xl text-neutral-600 transition-all flex items-center justify-center gap-2 group"
        >
          <CalendarIcon size={16} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
          <span className="text-sm font-medium">
            {selectedDate ? format(selectedDate, "d. MMMM yyyy", { locale: de }) : "Kalender öffnen"}
          </span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const today = new Date();
              setSelectedDate(isToday(selectedDate || new Date(0)) ? undefined : today);
            }}
            className={cn(
              "flex-1 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
              selectedDate && isToday(selectedDate)
                ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
            )}
          >
            Heute
          </button>
          <button
            onClick={() => {
              const tomorrow = addDays(new Date(), 1);
              setSelectedDate(isTomorrow(selectedDate || new Date(0)) ? undefined : tomorrow);
            }}
            className={cn(
              "flex-1 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
              selectedDate && isTomorrow(selectedDate)
                ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
            )}
          >
            Morgen
          </button>
        </div>
        <button 
          onClick={() => setShowCalendar(true)}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          + Mehr Zeitspannen
        </button>
      </div>

      {/* Schnellfilter (Quick Filters) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Schnellfilter</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedQuickFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleQuickFilter(filter.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl transition-all group",
                  isActive
                    ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
                    : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                )}
              >
                <Icon 
                  size={20} 
                  strokeWidth={1.5} 
                  className={cn(
                    "mb-1.5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-600"
                  )} 
                />
                <span className="text-[10px] font-medium leading-tight text-center">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preis (Price) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Preis</h3>
        <div className="flex p-1 bg-neutral-100 rounded-2xl">
          {priceFilters.map((price) => (
            <button
              key={price.id}
              onClick={() => setSelectedPrice(price.id)}
              className={cn(
                "flex-1 px-2 py-2.5 text-xs font-medium transition-all rounded-xl",
                selectedPrice === price.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {price.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stadt und Radius */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Stadt & Radius</h3>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Stadt eingeben..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            list="cities"
            className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 rounded-2xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-200 transition-all"
          />
          <datalist id="cities">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
        <div className="pt-2 px-1">
          <Slider
            value={radius}
            onValueChange={setRadius}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-neutral-400">Umkreis</span>
            <span className="text-sm font-semibold text-neutral-900 tabular-nums">{radius[0]} km</span>
          </div>
        </div>
      </div>

      {/* Kategorie */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Kategorie</h3>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full rounded-2xl border-0 bg-neutral-50 py-3.5 text-sm text-neutral-600 focus:ring-2 focus:ring-neutral-200 hover:bg-neutral-100 transition-colors">
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent className="bg-white border-0 shadow-xl shadow-neutral-900/10 rounded-2xl overflow-hidden">
            {categories.map((cat) => (
              <SelectItem 
                key={cat.value} 
                value={cat.value} 
                className="cursor-pointer py-3 focus:bg-neutral-50"
              >
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subkategorie */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Subkategorie</h3>
        <div className="flex flex-wrap gap-2">
          {currentSubcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => toggleSubcategory(sub)}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-medium transition-all",
                selectedSubcategories.includes(sub)
                  ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {sub}
            </button>
          ))}
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
            {filteredEvents.length} Events gefunden
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-10">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-neutral-900/5 border border-white/50 max-h-[calc(100vh-120px)] overflow-y-auto">
              <FilterContent />
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
                    {selectedQuickFilters.length + (selectedPrice !== "all" ? 1 : 0) + selectedSubcategories.length}
                  </span>
                )}
              </button>
            </div>

            {/* Uniform Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/event/${event.slug}`}
                  className="block group"
                >
                  <article className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-neutral-900/5 hover:shadow-2xl hover:shadow-neutral-900/15 hover:-translate-y-2 transition-all duration-500 ease-out">
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full aspect-[5/6] object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-neutral-700 shadow-sm">
                        {event.category}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite({
                            id: event.id,
                            slug: event.slug,
                            title: event.title,
                            venue: event.venue,
                            location: event.location,
                            image: event.image,
                            date: event.date,
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
                      <p className="text-xs text-neutral-400 mb-1.5 font-medium">{event.date}</p>
                      <h3 className="font-serif text-lg text-neutral-900 line-clamp-1 group-hover:text-neutral-700 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-neutral-400 mt-1.5 flex items-center gap-1.5">
                        <MapPin size={12} />
                        {event.location}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {filteredEvents.length === 0 && (
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

            <FilterContent />

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
