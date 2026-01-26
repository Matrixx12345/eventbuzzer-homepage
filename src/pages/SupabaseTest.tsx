import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Heart, Loader2, Sparkles, CheckCircle, RefreshCw } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";

interface ExternalEvent {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  long_description?: string;
  location?: string;
  venue_name?: string;
  address_street?: string;
  address_city?: string;
  address_zip?: string;
  start_date?: string;
  image_url?: string;
  price_from?: number;
}

// Placeholder images for events without images
const placeholderImages = [
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
];

const ExternalEventCard = ({ event, index }: { event: ExternalEvent; index: number }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(event.id);

  // Get a consistent placeholder image based on index
  const getPlaceholder = (idx: number) => placeholderImages[idx % placeholderImages.length];
  const imageToShow = event.image_url || getPlaceholder(index);

  // Build location string with street address
  const venuePart = event.venue_name || event.location || "";
  const addressPart = [event.address_street, event.address_zip, event.address_city].filter(Boolean).join(" ");
  const locationString = [venuePart, addressPart].filter(Boolean).join(" · ") || "Ort nicht angegeben";

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("de-CH", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Use short_description if available, otherwise fall back to description
  const displayDescription = event.short_description || event.description;

  return (
    <Link to={`/event/${event.id}`} className="block">
      <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageToShow}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = getPlaceholder(index);
          }}
        />

        {/* Price Badge */}
        {event.price_from && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            ab CHF {event.price_from}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite({
              id: event.id,
              slug: event.id,
              title: event.title,
              venue: event.venue_name || event.location || "",
              location: locationString,
              image: imageToShow,
              date: formatDate(event.start_date) || undefined,
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
          {locationString}
        </p>
        {event.start_date && (
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(event.start_date)}
          </p>
        )}
        {displayDescription && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {displayDescription}
          </p>
        )}
      </div>
      </article>
    </Link>
  );
};

const SupabaseTest = () => {
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Call the edge function that fetches from external Supabase
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

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSyncTicketmaster = async () => {
    setSyncing(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "sync-ticketmaster-events"
      );

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log("Sync result:", data);
      setSuccessMessage(data.message || `${data.synced} Events synchronisiert`);
      
      // Refresh events to show synced data
      await fetchEvents();
    } catch (err) {
      console.error("Error syncing events:", err);
      setError(err instanceof Error ? err.message : "Failed to sync events");
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateSummaries = async () => {
    setGenerating(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-event-summaries"
      );

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log("Generate summaries result:", data);
      setSuccessMessage(`AI-Beschreibungen wurden aktualisiert. ${data.updated} Events aktualisiert.`);
      
      // Refresh events to show new descriptions
      await fetchEvents();
    } catch (err) {
      console.error("Error generating summaries:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summaries");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <h1 className="text-4xl font-serif text-foreground">
            Supabase Events
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSyncTicketmaster}
              disabled={syncing || loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Events von Ticketmaster laden
            </Button>
            <Button
              onClick={handleGenerateSummaries}
              disabled={generating || loading || events.length === 0}
              className="flex items-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI-Beschreibungen generieren
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">
          Events aus deiner externen Supabase-Datenbank
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg border border-green-500/30 bg-green-500/10 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-400">{successMessage}</span>
          </div>
        )}

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
              <ExternalEventCard key={event.id} event={event} index={index} />
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
