import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import FavoritesFilterBar, { FilterOption } from "@/components/FavoritesFilterBar";
import { useFavorites, FavoriteEvent } from "@/contexts/FavoritesContext";
import { EventDetailModal } from "@/components/EventDetailModal";
import { ActionPill } from "@/components/ActionPill";
import heroImage from "@/assets/hero-mountains.jpg";
import { useScrollToTop } from "@/hooks/useScrollToTop";

// Helper to format tag names for display
const formatTagName = (tag: string): string => {
  const tagMap: Record<string, string> = {
    'familie-freundlich': 'Familie',
    'must-see': 'Must-See',
    'mistwetter': 'Mistwetter',
    'ganzjährig': 'Ganzjährig',
    'wellness': 'Wellness',
    'natur': 'Natur',
    'kunst': 'Kunst',
    'kultur': 'Kultur',
  };
  return tagMap[tag] || tag;
};

// Convert FavoriteEvent to event format for EventDetailModal
const favoriteToEvent = (favorite: FavoriteEvent) => ({
  id: favorite.id,
  title: favorite.title,
  image_url: favorite.image_url || favorite.image,
  short_description: favorite.short_description || "",
  description: favorite.description || "",
  tags: favorite.tags || [],
  venue_name: favorite.venue_name || favorite.venue,
  address_city: favorite.address_city || favorite.location,
  location: favorite.location,
  start_date: favorite.start_date || "",
  end_date: favorite.end_date || "",
  price_from: favorite.price_from,
  external_id: favorite.external_id || favorite.slug || favorite.id,
  ticket_url: favorite.ticket_url || "",
  url: favorite.url || "",
  buzz_score: favorite.buzz_score,
});

const Favorites = () => {
  useScrollToTop();
  const { favorites } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [selectedEvent, setSelectedEvent] = useState<ReturnType<typeof favoriteToEvent> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Handle card click to open modal
  const handleCardClick = (favorite: FavoriteEvent) => {
    const event = favoriteToEvent(favorite);
    setSelectedEvent(event);
    setModalOpen(true);
  };

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
        result.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
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
            Deine Favoriten
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            {favorites.length === 0
              ? "Erkunde Events und speichere deine Favoriten"
              : `${favorites.length} gespeicherte${favorites.length === 1 ? 's Event' : ' Events'} warten auf dich`
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
                  ? "Noch keine Favoriten"
                  : "Keine Events passen zu diesem Filter"
                }
              </h2>
              <p className="text-neutral-600 mb-8">
                {favorites.length === 0
                  ? "Klicke auf das Herz-Symbol bei einem Event, um es hier zu speichern"
                  : "Versuche einen anderen Filter, um deine gespeicherten Events zu sehen"
                }
              </p>
              {favorites.length === 0 && (
                <Link
                  to="/"
                  className="inline-block bg-neutral-900 text-white px-8 py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors"
                >
                  Events erkunden
                </Link>
              )}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              {filteredFavorites.map((event, index) => (
                <article
                  key={event.id}
                  onClick={() => handleCardClick(event)}
                  className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={event.image_url || event.image}
                      alt={event.title}
                      className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${
                        index === 0 ? 'aspect-[5/6]' : 'h-auto'
                      }`}
                    />

                    {/* Category Tags on Image - top left, show only first one */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/70 backdrop-blur-md text-gray-800 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded">
                          {formatTagName(event.tags[0])}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-neutral-900 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-neutral-400 mt-1">{event.address_city || event.location}</p>

                      {/* Short Description */}
                      {event.short_description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {event.short_description}
                        </p>
                      )}
                    </div>

                    {/* Action Pill at bottom */}
                    <div className="mt-4 flex justify-center">
                      <ActionPill
                        eventId={event.id}
                        slug={event.slug}
                        image={event.image}
                        title={event.title}
                        venue={event.venue}
                        location={event.address_city || event.location}
                        buzzScore={event.buzz_score}
                        ticketUrl={event.ticket_url}
                        variant="light"
                        event={event as any}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
        variant="solid"
      />
    </div>
  );
};

export default Favorites;
