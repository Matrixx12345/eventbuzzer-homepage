import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import FavoritesFilterBar, { FilterOption } from "@/components/FavoritesFilterBar";
import { useFavorites } from "@/contexts/FavoritesContext";
import heroImage from "@/assets/hero-mountains.jpg";

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  const filteredFavorites = useMemo(() => {
    let result = [...favorites];

    switch (activeFilter) {
      case "upcoming":
        result.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return a.date.localeCompare(b.date);
        });
        break;
      case "recently-added":
        result.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case "this-weekend":
        break;
      case "all":
      default:
        break;
    }

    return result;
  }, [favorites, activeFilter]);

  return (
    <div className="min-h-screen bg-stone-50">
      <Helmet>
        <title>Meine Favoriten - EventBuzzer</title>
        <meta name="description" content="Deine gespeicherten Lieblings-Events in der Schweiz. Behalte alle Events im Blick, die du nicht verpassen möchtest." />
        <meta property="og:title" content="Meine Favoriten - EventBuzzer" />
        <meta property="og:description" content="Deine gespeicherten Lieblings-Events in der Schweiz." />
        <meta property="og:url" content={`${SITE_URL}/favorites`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <link rel="canonical" href={`${SITE_URL}/favorites`} />

        {/* BreadcrumbList Schema for Google Rich Snippets */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Favoriten",
                "item": `${SITE_URL}/favorites`
              }
            ]
          })}
        </script>
      </Helmet>
      <Navbar />
      
      {/* Hero Header with Image */}
      <section className="relative h-40 md:h-48 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Favorites" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-2">
            Your Favorites
          </h1>
          <p className="text-white/80 text-sm md:text-base">
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

      {/* Masonry Grid */}
      <section className="py-8">
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
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              {filteredFavorites.map((event, index) => (
                <article 
                  key={event.id}
                  className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <Link to={`/event/${event.slug}`}>
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${
                          index === 0 ? 'aspect-[5/6]' : 'h-auto'
                        }`}
                      />
                      
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(event);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                        aria-label="Remove from favorites"
                      >
                        <Heart
                          size={18}
                          className="fill-red-500 text-red-500"
                        />
                      </button>
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link to={`/event/${event.slug}`}>
                      <h3 className="text-base font-semibold text-neutral-900 line-clamp-2 hover:text-neutral-600 transition-colors">
                        {event.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-neutral-500 mt-1">{event.venue}</p>
                    <p className="text-sm text-neutral-400">{event.location}</p>
                    {event.date && (
                      <p className="text-sm font-medium text-neutral-700 mt-2">{event.date}</p>
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
