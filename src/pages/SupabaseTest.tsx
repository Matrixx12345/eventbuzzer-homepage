import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Event {
  id: number;
  title: string;
  venue_name?: string;
  location?: string;
  address_city?: string;
  address_street?: string;
  address_zip?: string;
  image_url?: string | null;
  start_date?: string;
  end_date?: string;
  price_from?: number;
  ticket_link?: string;
  description?: string;
  category_main_id?: number;
}

// Placeholder images for events without images
const placeholderImages = [
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
];

const ExternalEventCard = ({ event }: { event: Event }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(String(event.id));

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return format(date, "dd.MM.yyyy, HH:mm 'Uhr'", { locale: de });
    } catch {
      return dateString;
    }
  };

  // Get a consistent placeholder image based on event id
  const getPlaceholder = (id: number) => placeholderImages[id % placeholderImages.length];
  const imageToShow = event.image_url || getPlaceholder(event.id);

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageToShow}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = getPlaceholder(event.id);
          }}
        />
        
        {/* Price Badge */}
        {event.price_from && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <span>ab CHF {event.price_from}</span>
          </div>
        )}


        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite({
              id: String(event.id),
              slug: String(event.id),
              title: event.title,
              venue: event.venue_name || "",
              location: event.location || event.address_city || "",
              image: imageToShow,
              date: event.start_date,
            });
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors"
          aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-card-foreground"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {event.venue_name || event.location || event.address_city || "Ort nicht angegeben"}
        </p>
        {event.start_date && (
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(event.start_date)}
          </p>
        )}
        {event.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </article>
  );
};

const SupabaseTest = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Call the edge function that connects to external Supabase
        const { data, error: fnError } = await supabase.functions.invoke(
          "get-external-events"
        );

        if (fnError) {
          throw fnError;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setEvents(data?.events || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif text-foreground mb-2">
          Supabase Test Page
        </h1>
        <p className="text-muted-foreground mb-8">
          Events aus deiner externen Supabase-Datenbank
        </p>

        {/* Connection Status */}
        <div className="mb-8 p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold text-card-foreground mb-2">Verbindungsstatus</h2>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Lade Events...</span>
            </div>
          )}
          {error && <p className="text-destructive">Fehler: {error}</p>}
          {!loading && !error && (
            <p className="text-green-600">
              Verbunden! {events.length} Events gefunden.
            </p>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <ExternalEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          !error && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Keine Events in der Datenbank gefunden.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default SupabaseTest;
