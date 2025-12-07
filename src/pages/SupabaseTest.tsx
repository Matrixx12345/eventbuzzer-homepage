import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Heart, Flame, Loader2, ImageOff } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Taxonomy {
  name: string;
}

interface Event {
  id: string;
  slug?: string;
  title: string;
  venue_name?: string;
  location?: string;
  image_url?: string | null;
  start_date?: string;
  is_popular?: boolean;
  taxonomy?: Taxonomy | null;
}

interface ExternalEventCardProps {
  event: Event;
}

const ExternalEventCard = ({ event }: ExternalEventCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(event.id);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return format(date, "dd.MM.yyyy, HH:mm 'Uhr'", { locale: de });
    } catch {
      return dateString;
    }
  };

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        {/* Placeholder for missing/broken images */}
        <div className={`absolute inset-0 flex items-center justify-center bg-muted ${event.image_url ? 'hidden' : ''}`}>
          <ImageOff className="w-12 h-12 text-muted-foreground/50" />
        </div>
        
        {/* Category Badge */}
        {event.taxonomy?.name && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <span>{event.taxonomy.name}</span>
          </div>
        )}

        {/* Popular Badge */}
        {event.is_popular && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <Flame size={14} />
            <span>POPULAR</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite({
              id: event.id,
              slug: event.slug || event.id,
              title: event.title,
              venue: event.venue_name || "",
              location: event.location || "",
              image: event.image_url || "",
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
          {event.venue_name || event.location || "Ort nicht angegeben"}
        </p>
        {event.start_date && (
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(event.start_date)}
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
