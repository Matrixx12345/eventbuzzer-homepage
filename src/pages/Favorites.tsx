import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import FavoritesFilterBar, { FilterOption } from "@/components/FavoritesFilterBar";
import { useFavorites } from "@/contexts/FavoritesContext";

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  const filteredFavorites = useMemo(() => {
    let result = [...favorites];

    switch (activeFilter) {
      case "upcoming":
        // Sort by event date (assuming date format allows string comparison)
        result.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return a.date.localeCompare(b.date);
        });
        break;
      case "recently-added":
        // Sort by when added (most recent first)
        result.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case "this-weekend":
        // Filter for this weekend (simplified - shows all for demo)
        // In production, would check actual dates
        break;
      case "all":
      default:
        // Keep original order
        break;
    }

    return result;
  }, [favorites, activeFilter]);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white py-16 border-b border-neutral-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4">
            Your Favorites
          </h1>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            {favorites.length === 0 
              ? "Start exploring and save events you love" 
              : `${favorites.length} saved ${favorites.length === 1 ? 'event' : 'events'} waiting for you`
            }
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <FavoritesFilterBar 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
      />

      {/* Favorites Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFavorites.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={64} className="mx-auto text-neutral-300 mb-6" />
              <h2 className="font-serif text-2xl text-neutral-900 mb-3">
                {favorites.length === 0 
                  ? "No favorites yet" 
                  : "No events match this filter"
                }
              </h2>
              <p className="text-neutral-600 mb-8">
                {favorites.length === 0 
                  ? "Click the heart icon on any event to save it here" 
                  : "Try a different filter to see your saved events"
                }
              </p>
              {favorites.length === 0 && (
                <Link 
                  to="/"
                  className="inline-block bg-neutral-900 text-white px-8 py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors"
                >
                  Explore Events
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFavorites.map((event) => (
                <article 
                  key={event.id}
                  className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 relative"
                >
                  <Link to={`/event/${event.slug}`}>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(event);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
                        aria-label="Remove from favorites"
                      >
                        <Heart
                          size={20}
                          className="fill-red-500 text-red-500"
                        />
                      </button>
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link to={`/event/${event.slug}`}>
                      <h3 className="text-lg font-semibold text-neutral-900 line-clamp-1 hover:text-neutral-600 transition-colors">
                        {event.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-neutral-600 mt-1">{event.venue}</p>
                    <p className="text-sm text-neutral-500">{event.location}</p>
                    {event.date && (
                      <p className="text-sm font-medium text-neutral-900 mt-2">{event.date}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Favorites;
