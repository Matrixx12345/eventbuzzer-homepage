import { useState } from "react";
import { 
  Heart, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Calendar, 
  Cake, 
  CloudRain, 
  UtensilsCrossed,
  Camera,
  Heart as HeartIcon,
  Smile,
  PartyPopper,
  Waves,
  Mountain,
  ChevronDown,
  Search
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
  { id: "free", label: "Kostenlos" },
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
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

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
    setSelectedDate(null);
    setSelectedQuickFilters([]);
    setSelectedPrice("all");
    setSelectedCity("");
    setRadius([0]);
    setSelectedCategory("all");
    setSelectedSubcategories([]);
  };

  const hasActiveFilters = 
    selectedDate !== null ||
    selectedQuickFilters.length > 0 ||
    selectedPrice !== "all" ||
    selectedCity !== "" ||
    radius[0] > 0 ||
    selectedCategory !== "all" ||
    selectedSubcategories.length > 0;

  const currentSubcategories = subcategories[selectedCategory] || subcategories.all;

  const FilterContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-neutral-900">Filter</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-2"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Datum (Date) */}
      <div className="mb-6">
        <h3 className="font-medium text-neutral-800 mb-3">Datum</h3>
        <button className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 mb-3">
          <Calendar size={18} />
          Kalender
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedDate(selectedDate === "heute" ? null : "heute")}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
              selectedDate === "heute"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
            )}
          >
            heute
          </button>
          <button
            onClick={() => setSelectedDate(selectedDate === "morgen" ? null : "morgen")}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
              selectedDate === "morgen"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
            )}
          >
            morgen
          </button>
        </div>
        <button className="w-full mt-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors text-left">
          mehr Zeitspannen
        </button>
        <div className="border-b border-neutral-200 mt-4" />
      </div>

      {/* Schnellfilter (Quick Filters) */}
      <div className="mb-6">
        <h3 className="font-medium text-neutral-800 mb-3">Schnellfilter</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedQuickFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleQuickFilter(filter.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border transition-all aspect-square",
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                )}
              >
                <Icon size={22} strokeWidth={1.5} className="mb-1.5" />
                <span className="text-[11px] font-medium leading-tight text-center">{filter.label}</span>
              </button>
            );
          })}
        </div>
        <div className="border-b border-neutral-200 mt-4" />
      </div>

      {/* Preis (Price) */}
      <div className="mb-6">
        <h3 className="font-medium text-neutral-800 mb-3">Preis</h3>
        <div className="flex rounded-xl border border-neutral-200 overflow-hidden">
          {priceFilters.map((price, index) => (
            <button
              key={price.id}
              onClick={() => setSelectedPrice(price.id)}
              className={cn(
                "flex-1 px-3 py-2.5 text-sm font-medium transition-all",
                selectedPrice === price.id
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-50",
                index !== priceFilters.length - 1 && "border-r border-neutral-200"
              )}
            >
              {price.label}
            </button>
          ))}
        </div>
        <div className="border-b border-neutral-200 mt-4" />
      </div>

      {/* Stadt und Radius */}
      <div className="mb-6">
        <h3 className="font-medium text-neutral-800 mb-3">Gewählte Stadt und Radius</h3>
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Stadt suchen..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            list="cities"
            className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all"
          />
          <datalist id="cities">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
        <div className="px-1">
          <Slider
            value={radius}
            onValueChange={setRadius}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-end mt-2">
            <span className="text-sm text-neutral-600 font-medium">{radius[0]} km</span>
          </div>
        </div>
        <div className="border-b border-neutral-200 mt-4" />
      </div>

      {/* Kategorie */}
      <div className="mb-6">
        <h3 className="font-medium text-neutral-800 mb-3">Gewählte Kategorie</h3>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full rounded-xl border-neutral-200 py-3 text-neutral-600 focus:ring-2 focus:ring-neutral-100">
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-neutral-200 rounded-xl">
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="cursor-pointer">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subkategorie */}
      <div className="mb-6">
        <h3 className="font-medium text-neutral-800 mb-3">Subkategorie</h3>
        <div className="flex flex-wrap gap-2">
          {currentSubcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => toggleSubcategory(sub)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm font-medium transition-all border",
                selectedSubcategories.includes(sub)
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
              )}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-serif text-3xl md:text-4xl text-neutral-900">
            Events entdecken
          </h1>
          <p className="text-neutral-500 mt-1">
            {filteredEvents.length} Events gefunden
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-neutral-200 p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <SlidersHorizontal size={16} />
                Filter
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-neutral-900 text-white rounded-full text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 space-y-4">
              {filteredEvents.map((event, index) => (
                <Link
                  key={event.id}
                  to={`/event/${event.slug}`}
                  className="block break-inside-avoid group"
                >
                  <article className="bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className={cn(
                          "w-full object-cover hover:scale-105 transition-transform duration-500",
                          index === 0 ? "aspect-[5/6]" : index % 3 === 1 ? "aspect-[4/3]" : "aspect-square"
                        )}
                      />
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-neutral-700">
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
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                        aria-label={isFavorite(event.id) ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                      >
                        <Heart
                          size={18}
                          className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-600"}
                        />
                      </button>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-neutral-500 mb-1">{event.date}</p>
                      <h3 className="font-serif text-lg text-neutral-900 line-clamp-1 group-hover:text-neutral-700 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {event.location}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-16">
                <p className="text-neutral-500">Keine Events gefunden.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-full text-sm hover:bg-neutral-800 transition-colors"
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-neutral-900">Filter</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <FilterContent />

            <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t border-neutral-200">
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Zurücksetzen
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 py-3 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                  {filteredEvents.length} Ergebnisse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Listings;
