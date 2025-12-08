import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";

interface TicketmasterEvent {
  id: string;
  name: string;
  venue?: string;
  city?: string;
  date?: string;
  image?: string;
}

// Placeholder images for events without images
const placeholderImages = [
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
];

const TicketmasterEventCard = ({ event, index }: { event: TicketmasterEvent; index: number }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(event.id);

  // Get a consistent placeholder image based on index
  const getPlaceholder = (idx: number) => placeholderImages[idx % placeholderImages.length];
  const imageToShow = event.image || getPlaceholder(index);

  // Build location string
  const locationParts = [event.venue, event.city].filter(Boolean);
  const locationString = locationParts.join(", ") || "Ort nicht angegeben";

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageToShow}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = getPlaceholder(index);
          }}
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite({
              id: event.id,
              slug: event.id,
              title: event.name,
              venue: event.venue || "",
              location: locationString,
              image: imageToShow,
              date: event.date,
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
          {event.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {locationString}
        </p>
        {event.date && (
          <p className="text-sm text-muted-foreground mt-1">
            {event.date}
          </p>
        )}
      </div>
    </article>
  );
};

const SupabaseTest = () => {
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Call the edge function that fetches Ticketmaster events
        const { data, error: fnError } = await supabase.functions.invoke(
          "get-ticketmaster-events"
        );

        if (fnError) {
          throw fnError;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setEvents(data?.events || []);
      } catch (err) {
        console.error("Error fetching Ticketmaster events:", err);
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
          Ticketmaster Events
        </h1>
        <p className="text-muted-foreground mb-8">
          Live-Events von Ticketmaster
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
            {events.map((event, index) => (
              <TicketmasterEventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          !error && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Keine Events gefunden.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default SupabaseTest;
