import { useState } from "react";
import { 
  Heart, 
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
  Search
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
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

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-serif text-3xl md:text-4xl text-neutral-900">
            Events entdecken
          </h1>
          <p className="text-neutral-400 mt-1 text-sm">
            {filteredEvents.length} Events gefunden
          </p>
        </div>
      </div>

      {/* Sticky Glass Filter Bar */}
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-white/70 border-b border-white/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Row 1: Quick filters + Date */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-3">
            {/* Date buttons */}
            <button
              onClick={() => setSelectedDate(selectedDate === "heute" ? null : "heute")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedDate === "heute"
                  ? "bg-neutral-900 text-white"
                  : "bg-white/80 border border-neutral-200 text-neutral-600 hover:bg-white"
              )}
            >
              <Calendar size={14} />
              Heute
            </button>
            <button
              onClick={() => setSelectedDate(selectedDate === "morgen" ? null : "morgen")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedDate === "morgen"
                  ? "bg-neutral-900 text-white"
                  : "bg-white/80 border border-neutral-200 text-neutral-600 hover:bg-white"
              )}
            >
              <Calendar size={14} />
              Morgen
            </button>

            <div className="w-px h-6 bg-neutral-200" />

            {/* Quick filters */}
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedQuickFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleQuickFilter(filter.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "bg-white/80 border border-neutral-200 text-neutral-600 hover:bg-white"
                  )}
                >
                  <Icon size={14} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: Price, City, Category, Subcategory */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {/* Price Pills */}
            <div className="flex p-1 bg-white/80 rounded-full border border-neutral-200">
              {priceFilters.map((price) => (
                <button
                  key={price.id}
                  onClick={() => setSelectedPrice(price.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-all rounded-full whitespace-nowrap",
                    selectedPrice === price.id
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:text-neutral-700"
                  )}
                >
                  {price.label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-neutral-200" />

            {/* City Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Stadt..."
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                list="cities"
                className="pl-8 pr-3 py-2 bg-white/80 rounded-full text-sm text-neutral-800 placeholder:text-neutral-400 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 w-32"
              />
              <datalist id="cities">
                {cities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>

            {/* Radius */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-full border border-neutral-200">
              <MapPin size={14} className="text-neutral-400" />
              <span className="text-xs text-neutral-500">Radius:</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={radius[0]}
                onChange={(e) => setRadius([parseInt(e.target.value)])}
                className="w-16 h-1 bg-neutral-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-900"
              />
              <span className="text-xs font-medium text-neutral-700 tabular-nums w-10">{radius[0]} km</span>
            </div>

            <div className="w-px h-6 bg-neutral-200" />

            {/* Category */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-auto min-w-[140px] rounded-full border-neutral-200 bg-white/80 py-2 text-sm text-neutral-600 focus:ring-2 focus:ring-neutral-300">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-xl shadow-neutral-900/10 rounded-2xl overflow-hidden">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="cursor-pointer py-2.5 focus:bg-neutral-50">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategories */}
            {currentSubcategories.slice(0, 5).map((sub) => (
              <button
                key={sub}
                onClick={() => toggleSubcategory(sub)}
                className={cn(
                  "px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  selectedSubcategories.includes(sub)
                    ? "bg-neutral-900 text-white"
                    : "bg-white/80 border border-neutral-200 text-neutral-600 hover:bg-white"
                )}
              >
                {sub}
              </button>
            ))}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-600 transition-colors whitespace-nowrap"
              >
                <X size={12} />
                Zurücksetzen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/event/${event.slug}`}
              className="block group"
            >
              <article className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-neutral-900/5 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300">
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
      </div>
    </div>
  );
};

export default Listings;
