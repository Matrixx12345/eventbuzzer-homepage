import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Star, ChevronDown, Calendar, Grid3X3, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import mapTeaser from "@/assets/map-teaser.jpg";

const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

// Helper to ensure tags is an array
const ensureTagsArray = (tags: unknown): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(t => typeof t === 'string');
  return [];
};

interface Event {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  short_description?: string;
  location?: string;
  venue_name?: string;
  address_city?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  price_from?: number;
  price_to?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  source?: string;
  relevance_score?: number;
  buzz_score?: number;
}

// Star Rating Component
const StarRating = ({ score, className }: { score: number; className?: string }) => {
  // Convert buzz score (0-100) to stars (0-5)
  const starCount = Math.min(5, Math.max(0, Math.round((score / 100) * 5)));
  
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={cn(
            "transition-colors",
            star <= starCount
              ? "fill-amber-500 text-amber-500"
              : "fill-transparent text-amber-300"
          )}
        />
      ))}
    </div>
  );
};

// Event Card Component
const EventCard = ({
  event,
  index,
  isFavorited,
  onToggleFavorite,
}: {
  event: Event;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: (event: Event) => void;
}) => {
  const imageUrl = event.image_url || getPlaceholderImage(index);
  const location = event.venue_name || event.address_city || event.location || "Schweiz";
  const description = event.short_description || event.description || "Entdecke dieses einzigartige Event in der Schweiz.";
  const buzzScore = event.buzz_score || event.relevance_score || 75;

  return (
    <article className="group bg-[hsl(var(--listings-card))] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-[hsl(var(--trip-border))]">
      <div className="flex gap-0">
        {/* Image Section */}
        <div className="relative w-48 h-40 flex-shrink-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(event);
            }}
            className={cn(
              "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md",
              isFavorited
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500"
            )}
          >
            <Heart size={16} className={isFavorited ? "fill-current" : ""} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            {/* Title */}
            <h3 className="font-serif text-lg font-semibold text-[hsl(var(--listings-text))] mb-1 line-clamp-1 group-hover:text-amber-700 transition-colors">
              {event.title}
            </h3>
            
            {/* Location */}
            <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--listings-text-muted))] mb-3">
              <MapPin size={14} className="text-amber-600" />
              <span>{location}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-[hsl(var(--listings-text-muted))] line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Star Rating - Bottom Right */}
          <div className="flex items-center justify-end mt-3 gap-2">
            <span className="text-xs font-medium text-amber-700">Buzz</span>
            <StarRating score={buzzScore} />
          </div>
        </div>
      </div>
    </article>
  );
};

// Filter Accordion Component
const FilterAccordion = ({ 
  icon: Icon, 
  label, 
  isOpen, 
  onToggle 
}: { 
  icon: React.ElementType;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between py-3 px-4 text-sm text-[hsl(var(--listings-text))] hover:bg-[hsl(var(--trip-bg-secondary))] rounded-lg transition-colors"
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-amber-600" />
      <span className="font-medium">{label}</span>
    </div>
    <ChevronDown size={18} className={cn("text-gray-400 transition-transform", isOpen && "rotate-180")} />
  </button>
);

const EventList1 = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await externalSupabase
          .from("events")
          .select("*")
          .eq("hide_from_homepage", false)
          .not("image_url", "is", null)
          .gte("relevance_score", 50)
          .or(`start_date.is.null,start_date.lte.${futureDate}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(20);

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        toast.error("Fehler beim Laden der Events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleToggleFavorite = useCallback(async (event: Event) => {
    const slug = event.external_id || event.id;
    const favoriteData = {
      id: event.id,
      slug: slug,
      title: event.title,
      image: event.image_url || getPlaceholderImage(0),
      location: event.venue_name || event.address_city || event.location || "Schweiz",
      venue: event.venue_name || "",
      date: event.start_date || "",
    };

    toggleFavorite(favoriteData);
  }, [toggleFavorite]);

  const isFavorited = (eventId: string) => favorites.some(f => f.id === eventId);

  return (
    <div className="min-h-screen bg-[hsl(var(--listings-bg))]">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex gap-8">
          {/* Left: Event List */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-serif font-bold text-[hsl(var(--listings-text))] mb-2">
                Eventliste 1
              </h1>
              <p className="text-[hsl(var(--listings-text-muted))]">
                Entdecke die besten Events in der Schweiz
              </p>
            </div>

            {/* Event Cards */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    isFavorited={isFavorited(event.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="w-80 flex-shrink-0 space-y-6">
            {/* Map Teaser */}
            <div 
              className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-[hsl(var(--trip-border))] cursor-pointer group"
              onClick={() => setMapOpen(true)}
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={mapTeaser}
                  alt="Karte der Schweiz"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white font-medium bg-black/50 px-4 py-2 rounded-full">
                    <Maximize2 size={18} />
                    <span>Karte vergrößern</span>
                  </div>
                </div>
                {/* Always visible expand icon */}
                <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Maximize2 size={18} className="text-gray-700" />
                </div>
                {/* Map pins overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <MapPin size={12} className="text-white" />
                  </div>
                  <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <MapPin size={12} className="text-white" />
                  </div>
                  <div className="absolute bottom-1/3 left-1/2 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <MapPin size={12} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white text-center text-sm font-medium text-[hsl(var(--listings-text-muted))]">
                Switzerland
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-[hsl(var(--trip-border))] overflow-hidden">
              <div className="p-4 border-b border-[hsl(var(--trip-border))]">
                <h3 className="font-serif font-semibold text-[hsl(var(--listings-text))]">Filters</h3>
              </div>
              <div className="p-2">
                <FilterAccordion
                  icon={Calendar}
                  label="Date"
                  isOpen={openFilter === 'date'}
                  onToggle={() => setOpenFilter(openFilter === 'date' ? null : 'date')}
                />
                <FilterAccordion
                  icon={Grid3X3}
                  label="Category"
                  isOpen={openFilter === 'category'}
                  onToggle={() => setOpenFilter(openFilter === 'category' ? null : 'category')}
                />
                <FilterAccordion
                  icon={MapPin}
                  label="Location"
                  isOpen={openFilter === 'location'}
                  onToggle={() => setOpenFilter(openFilter === 'location' ? null : 'location')}
                />
                <FilterAccordion
                  icon={Heart}
                  label="Favoriten"
                  isOpen={openFilter === 'favorites'}
                  onToggle={() => setOpenFilter(openFilter === 'favorites' ? null : 'favorites')}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Map Dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-5xl h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="font-serif">Karte - Events in der Schweiz</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full bg-gray-100 flex items-center justify-center">
            <div className="relative w-full h-full">
              <img
                src={mapTeaser}
                alt="Karte der Schweiz"
                className="w-full h-full object-cover"
              />
              {/* Map pins */}
              <div className="absolute inset-0">
                {events.slice(0, 5).map((event, i) => (
                  <div
                    key={event.id}
                    className="absolute w-8 h-8 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      top: `${20 + (i * 15)}%`,
                      left: `${15 + (i * 18)}%`,
                    }}
                  >
                    <MapPin size={14} className="text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventList1;
