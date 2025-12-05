import { useState } from "react";
import { Heart, SlidersHorizontal, X, MapPin, Calendar, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

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
  { id: "einsiedeln-abbey", slug: "einsiedeln-abbey", image: eventAbbey, title: "Photo Spot Einsiedeln Abbey", venue: "Leonard House", location: "Einsiedeln", category: "Culture", date: "Dec 15, 2025" },
  { id: "nordportal", slug: "nordportal", image: eventVenue, title: "Nordportal", venue: "Leonard House", location: "Baden", category: "Music", date: "Dec 20, 2025" },
  { id: "kulturbetrieb-royal", slug: "kulturbetrieb-royal", image: eventConcert, title: "Kulturbetrieb Royal", venue: "Leonard House", location: "Baden", category: "Concert", date: "Dec 22, 2025" },
  { id: "zurich-tonhalle", slug: "zurich-tonhalle", image: eventSymphony, title: "Zurich Tonhalle", venue: "Tonhalle Orchestra", location: "Zürich", category: "Classical", date: "Dec 28, 2025" },
  { id: "zurich-lights", slug: "zurich-lights", image: swissZurich, title: "Zurich Christmas Lights", venue: "Old Town", location: "Zürich", category: "Festival", date: "Dec 10, 2025" },
  { id: "bern-markets", slug: "bern-markets", image: swissBern, title: "Bern Christmas Markets", venue: "Bundesplatz", location: "Bern", category: "Market", date: "Dec 12, 2025" },
  { id: "lucerne-festival", slug: "lucerne-festival", image: swissLucerne, title: "Lucerne Light Festival", venue: "Chapel Bridge", location: "Lucerne", category: "Festival", date: "Jan 5, 2026" },
  { id: "geneva-gala", slug: "geneva-gala", image: swissGeneva, title: "Geneva New Year Gala", venue: "Jet d'Eau", location: "Geneva", category: "Gala", date: "Dec 31, 2025" },
  { id: "jazz-night", slug: "jazz-night", image: weekendJazz, title: "Jazz Night at Moods", venue: "Moods Club", location: "Zürich", category: "Music", date: "Dec 18, 2025" },
  { id: "opera-house", slug: "opera-house", image: weekendOpera, title: "La Traviata", venue: "Opera House", location: "Zürich", category: "Opera", date: "Jan 10, 2026" },
];

const categories = ["All", "Music", "Culture", "Festival", "Concert", "Classical", "Opera", "Gala", "Market"];
const locations = ["All", "Zürich", "Bern", "Baden", "Lucerne", "Geneva", "Einsiedeln"];

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  const filteredEvents = allEvents.filter((event) => {
    const categoryMatch = selectedCategory === "All" || event.category === selectedCategory;
    const locationMatch = selectedLocation === "All" || event.location === selectedLocation;
    return categoryMatch && locationMatch;
  });

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedLocation("All");
  };

  const hasActiveFilters = selectedCategory !== "All" || selectedLocation !== "All";

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-serif text-3xl md:text-4xl text-neutral-900">
            Discover Events
          </h1>
          <p className="text-neutral-500 mt-1">
            {filteredEvents.length} events found
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-neutral-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-neutral-400" />
                  <h3 className="text-sm font-medium text-neutral-700">Category</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-all",
                        selectedCategory === cat
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-neutral-400" />
                  <h3 className="text-sm font-medium text-neutral-700">Location</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-all",
                        selectedLocation === loc
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter Placeholder */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-neutral-400" />
                  <h3 className="text-sm font-medium text-neutral-700">Date</h3>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4 text-center text-sm text-neutral-400">
                  Date picker coming soon
                </div>
              </div>
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
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-neutral-900 text-white rounded-full text-xs flex items-center justify-center">
                    {(selectedCategory !== "All" ? 1 : 0) + (selectedLocation !== "All" ? 1 : 0)}
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
                        aria-label={isFavorite(event.id) ? "Remove from favorites" : "Add to favorites"}
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
                <p className="text-neutral-500">No events match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-full text-sm hover:bg-neutral-800 transition-colors"
                >
                  Clear filters
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
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-neutral-900 text-lg">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-neutral-400" />
                <h3 className="text-sm font-medium text-neutral-700">Category</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all",
                      selectedCategory === cat
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-neutral-400" />
                <h3 className="text-sm font-medium text-neutral-700">Location</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all",
                      selectedLocation === loc
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Show {filteredEvents.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Listings;