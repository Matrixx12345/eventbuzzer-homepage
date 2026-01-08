import { useState, lazy, Suspense, useEffect, useCallback } from "react";
import { useFavorites, FavoriteEvent } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Sparkles, Car, Train, X, Plus, Loader2, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Lazy load the EventsMap for Mapbox
const EventsMap = lazy(() => import("@/components/EventsMap"));

interface ListingsTripSidebarProps {
  onEventClick?: (eventId: string) => void;
}

interface FavoriteWithCoords {
  id: string;
  latitude?: number;
  longitude?: number;
  title?: string;
  image?: string;
}

interface SuggestedEvent {
  id: string;
  title: string;
  location: string;
  image: string;
  buzzScore?: number;
  distance?: string;
}

// SBB Transport pill data
const sbbTransportData = [
  { line: "IC 8", icon: "train" },
  { line: "S3", icon: "train" },
  { line: "IR 50", icon: "train" },
  { line: "PE", icon: "train" },
  { line: "IC 3", icon: "train" },
  { line: "S12", icon: "train" },
  { line: "IR 36", icon: "train" },
];

const ListingsTripSidebar = ({ onEventClick }: ListingsTripSidebarProps) => {
  const { favorites, toggleFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<"auto" | "bahn">("bahn");
  const [mapEvents, setMapEvents] = useState<any[]>([]);
  const [favoriteEventsWithCoords, setFavoriteEventsWithCoords] = useState<FavoriteWithCoords[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  
  // Get favorite IDs for map highlighting
  const favoriteIds = favorites.map(f => f.id);

  // Fetch coordinates for favorites from the backend
  useEffect(() => {
    const fetchFavoriteCoords = async () => {
      if (favorites.length === 0) {
        setFavoriteEventsWithCoords([]);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-external-events', {
          body: {
            limit: 100,
            offset: 0,
            filters: {
              ids: favoriteIds
            }
          }
        });

        if (error) {
          console.error('Error fetching favorite coords:', error);
          return;
        }

        if (data?.events && Array.isArray(data.events)) {
          const coordsMap = new Map<string, FavoriteWithCoords>();
          data.events.forEach((e: any) => {
            const id = e.external_id || String(e.id);
            if (e.latitude && e.longitude) {
              coordsMap.set(id, {
                id,
                latitude: e.latitude,
                longitude: e.longitude,
                title: e.title,
                image: e.image_url
              });
            }
          });

          // Map favorites to include coordinates
          const withCoords = favorites.map(f => ({
            id: f.id,
            latitude: coordsMap.get(f.id)?.latitude,
            longitude: coordsMap.get(f.id)?.longitude,
            title: f.title,
            image: f.image
          })).filter(f => f.latitude && f.longitude);

          setFavoriteEventsWithCoords(withCoords);
        }
      } catch (err) {
        console.error('Failed to fetch favorite coords:', err);
      }
    };

    fetchFavoriteCoords();
  }, [favorites, favoriteIds]);

  // Update suggestions based on map events
  const handleEventsChange = useCallback((events: any[]) => {
    setMapEvents(events);
    // Transform map events to suggestions (16 for 2x8 grid)
    const suggestions = events.slice(0, 16).map((e: any) => ({
      id: e.id || e.external_id,
      title: e.title,
      location: e.address_city || e.venue_name || "Schweiz",
      image: e.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80",
      buzzScore: e.buzz_score,
      distance: "~1.2 km"
    }));
    setSuggestedEvents(suggestions);
  }, []);

  // Handle marker click - highlight in grid/plan
  const handleMarkerClick = useCallback((eventId: string) => {
    setHighlightedEventId(eventId);
    onEventClick?.(eventId);
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedEventId(null), 3000);
  }, [onEventClick]);

  if (isExpanded) {
    const gridFavorites = favorites.slice(0, 6); // Support up to 6 for the snake pattern
    
    return (
      <div className="fixed inset-0 z-[9999] bg-[#FDFBF7] overflow-auto">
        {/* X Button top right */}
        <button
          onClick={() => setIsExpanded(false)}
          className="fixed top-6 right-6 z-[10000] p-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-xl transition-all hover:scale-105"
        >
          <X size={24} className="text-stone-700" />
        </button>

        <div className="flex flex-col min-h-screen">
          {/* TOP: 2x8 Suggestions Grid */}
          <div className="px-8 pt-6 pb-4">
            <div className="grid grid-cols-8 gap-3">
              {/* Row 1 */}
              {suggestedEvents.slice(0, 8).map((event, idx) => (
                <SuggestionCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => handleMarkerClick(event.id)}
                  isHighlighted={highlightedEventId === event.id}
                />
              ))}
              {/* Fill empty slots in row 1 */}
              {Array.from({ length: Math.max(0, 8 - suggestedEvents.slice(0, 8).length) }).map((_, i) => (
                <EmptySuggestionCard key={`empty-1-${i}`} />
              ))}
              {/* Row 2 */}
              {suggestedEvents.slice(8, 16).map((event, idx) => (
                <SuggestionCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => handleMarkerClick(event.id)}
                  isHighlighted={highlightedEventId === event.id}
                />
              ))}
              {/* Fill empty slots in row 2 */}
              {Array.from({ length: Math.max(0, 8 - suggestedEvents.slice(8, 16).length) }).map((_, i) => (
                <EmptySuggestionCard key={`empty-2-${i}`} />
              ))}
            </div>
          </div>

          {/* BOTTOM: Map (50%) + Tagesplan (50%) */}
          <div className="flex flex-1 px-8 pb-8 gap-6">
            {/* LEFT: Map with 3 layers */}
            <div className="w-1/2">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-stone-200/60 h-full min-h-[500px] bg-white/60 backdrop-blur-sm">
                <Suspense fallback={
                  <div className="w-full h-full bg-[#F5F3EF] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                  </div>
                }>
                  <EventsMap 
                    onEventClick={handleMarkerClick}
                    onEventsChange={handleEventsChange}
                    isVisible={true}
                    selectedEventIds={favoriteIds}
                    favoriteEvents={favoriteEventsWithCoords}
                  />
                </Suspense>
              </div>
            </div>

            {/* RIGHT: Dein Tagesplan */}
            <div className="w-1/2 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-3xl font-bold text-stone-800">Dein Tagesplan</h2>
                
                {/* Auto/Bahn Toggle */}
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-stone-200/60">
                  <button
                    onClick={() => setTransportMode("auto")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      transportMode === "auto"
                        ? "bg-stone-800 text-white shadow-md"
                        : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    <Car size={16} />
                    Auto
                  </button>
                  <button
                    onClick={() => setTransportMode("bahn")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      transportMode === "bahn"
                        ? "bg-stone-800 text-white shadow-md"
                        : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    <Train size={16} />
                    Bahn
                  </button>
                </div>
              </div>

              {/* Snake Flow Trip Plan */}
              <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-stone-200/40">
                {favorites.length === 0 ? (
                  <div className="text-center py-16 text-stone-400">
                    <Heart size={40} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
                    <p className="text-lg">Füge Favoriten hinzu, um deinen Trip zu planen</p>
                  </div>
                ) : (
                  <SnakeTripFlow 
                    favorites={gridFavorites} 
                    transportMode={transportMode}
                    onEventClick={handleMarkerClick}
                    onRemoveFavorite={(id) => {
                      const fav = favorites.find(f => f.id === id);
                      if (fav) toggleFavorite(fav);
                    }}
                    highlightedId={highlightedEventId}
                  />
                )}
              </div>

              {/* SBB Footer */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">SBB</div>
                  <span className="text-xs text-stone-400">Fahrplanvorschläge</span>
                </div>
                <span className="text-xs text-stone-400">
                  Letzte Aktualisierung: {new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} | {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed State
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200/80 overflow-visible">
      {/* Map - QUADRATISCH */}
      <div className="aspect-square w-full relative overflow-hidden">
        <Suspense fallback={
          <div className="w-full h-full bg-[hsl(var(--listings-bg))] flex items-center justify-center">
            <img 
              src="/swiss-outline.svg"
              className="w-full h-full object-contain opacity-20 p-4" 
              alt="Switzerland" 
            />
          </div>
        }>
          <EventsMap 
            onEventClick={onEventClick}
            onEventsChange={setMapEvents}
            isVisible={true}
            selectedEventIds={favoriteIds}
            favoriteEvents={favoriteEventsWithCoords}
          />
        </Suspense>
      </div>

      {/* Favorites List */}
      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart size={48} className="text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-stone-500 leading-relaxed">
              Wähle Favoriten (❤️) – wir erstellen deinen perfekten Ablauf.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer group transition-colors"
                onClick={() => onEventClick?.(fav.id)}
              >
                <img
                  src={fav.image}
                  alt={fav.title}
                  className="w-11 h-11 rounded-lg object-cover shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{fav.title}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {fav.location || "Schweiz"}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(fav);
                  }}
                  className="flex-shrink-0 p-1.5 hover:scale-110 transition-transform"
                >
                  <Heart size={16} className="text-red-500 fill-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Button */}
      <div className="p-4 pt-0">
        <button
          disabled={favorites.length === 0}
          onClick={() => setIsExpanded(true)}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300",
            favorites.length > 0
              ? "bg-stone-800 text-white hover:bg-stone-900 shadow-md hover:shadow-lg"
              : "bg-stone-100 text-stone-400 cursor-not-allowed"
          )}
        >
          <Sparkles size={16} />
          Deinen Trip planen ✨
        </button>
      </div>
    </div>
  );
};

// Suggestion Card - Square aspect ratio
interface SuggestionCardProps {
  event: SuggestedEvent;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const SuggestionCard = ({ event, onClick, isHighlighted }: SuggestionCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "aspect-square rounded-xl overflow-hidden cursor-pointer group relative transition-all duration-300",
        "bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg border border-stone-100/80",
        isHighlighted && "ring-2 ring-amber-400 ring-offset-2"
      )}
    >
      <img
        src={event.image}
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white font-medium text-[10px] leading-tight line-clamp-2 drop-shadow-lg">
          {event.title}
        </p>
        <p className="text-white/80 text-[8px] mt-0.5 flex items-center gap-0.5">
          <MapPin size={8} />
          {event.distance}
        </p>
      </div>
    </div>
  );
};

const EmptySuggestionCard = () => (
  <div className="aspect-square rounded-xl bg-stone-100/30 border border-dashed border-stone-200/60" />
);

// Snake Trip Flow - Circular images with snake connection
interface SnakeTripFlowProps {
  favorites: FavoriteEvent[];
  transportMode: "auto" | "bahn";
  onEventClick?: (eventId: string) => void;
  onRemoveFavorite?: (id: string) => void;
  highlightedId?: string | null;
}

const SnakeTripFlow = ({ favorites, transportMode, onEventClick, onRemoveFavorite, highlightedId }: SnakeTripFlowProps) => {
  // Mock transport data between events (calculated based on coordinates)
  const transportData = [
    { minutes: 12, km: 8.5 },
    { minutes: 24, km: 18.2 },
    { minutes: 18, km: 12.4 },
    { minutes: 15, km: 9.8 },
    { minutes: 9, km: 5.2 },
  ];

  // Fill to 6 slots for 2 rows of 3
  const slots: (FavoriteEvent | null)[] = [...favorites];
  while (slots.length < 6) {
    slots.push(null);
  }

  // Snake pattern: Row 1 L->R (0,1,2), Row 2 R->L (5,4,3)
  const row1 = [slots[0], slots[1], slots[2]];
  const row2 = [slots[5], slots[4], slots[3]]; // Reversed for snake

  return (
    <div className="flex flex-col gap-0 relative">
      {/* Row 1: Left to Right */}
      <div className="flex items-center justify-center gap-0">
        {row1.map((event, idx) => (
          <div key={idx} className="flex items-center">
            <CircularEventCard 
              event={event}
              onClick={() => event && onEventClick?.(event.id)}
              onRemove={() => event && onRemoveFavorite?.(event.id)}
              label={idx === 0 ? "Zürich HB: Start" : undefined}
              subLabel={idx === 0 ? "Abfahrt: 09:00" : `Aufenthalt: ~2h`}
              isHighlighted={event?.id === highlightedId}
            />
            {/* Horizontal connection line with transport pill */}
            {idx < 2 && (
              <div className="flex items-center relative mx-2">
                <div className="w-16 h-[2px] bg-stone-300" />
                <TransportPill 
                  minutes={transportData[idx]?.minutes || 15} 
                  km={transportData[idx]?.km || 10}
                  mode={transportMode}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Vertical connection on RIGHT side (going down) */}
      <div className="flex justify-end pr-16 relative">
        <div className="flex flex-col items-center">
          <div className="w-[2px] h-12 bg-stone-300" />
          <TransportPill 
            minutes={transportData[2]?.minutes || 18} 
            km={transportData[2]?.km || 12}
            mode={transportMode}
            vertical
          />
          <div className="w-[2px] h-6 bg-stone-300" />
        </div>
      </div>

      {/* Row 2: Right to Left (reversed visually) */}
      <div className="flex items-center justify-center gap-0">
        {row2.map((event, idx) => (
          <div key={idx} className="flex items-center">
            {/* Horizontal connection line BEFORE (except first) */}
            {idx > 0 && (
              <div className="flex items-center relative mx-2">
                <div className="w-16 h-[2px] bg-stone-300" />
                <TransportPill 
                  minutes={transportData[3 + idx - 1]?.minutes || 15} 
                  km={transportData[3 + idx - 1]?.km || 10}
                  mode={transportMode}
                />
              </div>
            )}
            <CircularEventCard 
              event={event}
              onClick={() => event && onEventClick?.(event.id)}
              onRemove={() => event && onRemoveFavorite?.(event.id)}
              label={idx === 0 ? "Zürich HB: Ende" : undefined}
              subLabel={idx === 0 ? "Ankunft: 18:30" : `Aufenthalt: ~2h`}
              isHighlighted={event?.id === highlightedId}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Circular Event Card
interface CircularEventCardProps {
  event: FavoriteEvent | null;
  onClick?: () => void;
  onRemove?: () => void;
  label?: string;
  subLabel?: string;
  isHighlighted?: boolean;
}

const CircularEventCard = ({ event, onClick, onRemove, label, subLabel, isHighlighted }: CircularEventCardProps) => {
  if (!event) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-stone-100/50 border-2 border-dashed border-stone-200/60 flex items-center justify-center">
          <Plus size={20} className="text-stone-300" />
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs text-stone-400">Leer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Circular Image with border */}
      <div 
        onClick={onClick}
        className={cn(
          "relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group transition-all duration-300",
          "ring-4 ring-stone-200 hover:ring-amber-400 shadow-lg",
          isHighlighted && "ring-amber-400 ring-offset-2"
        )}
      >
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {/* Heart overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="absolute top-1 right-1 p-1 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <Heart size={10} className="text-red-500 fill-red-500" />
        </button>
      </div>
      {/* Label below */}
      <div className="mt-2 text-center max-w-24">
        {label ? (
          <>
            <p className="text-xs font-semibold text-stone-700 line-clamp-1">{label}</p>
            <p className="text-[10px] text-stone-500">{subLabel}</p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-stone-700 line-clamp-1">{event.title.split(':')[0]}</p>
            <p className="text-[10px] text-stone-500">{subLabel}</p>
          </>
        )}
      </div>
    </div>
  );
};

// Transport Pill Component
interface TransportPillProps {
  minutes: number;
  km: number;
  mode: "auto" | "bahn";
  vertical?: boolean;
}

const TransportPill = ({ minutes, km, mode, vertical }: TransportPillProps) => {
  return (
    <div className={cn(
      "absolute flex flex-col items-center gap-0.5 pointer-events-none",
      vertical ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    )}>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/50 shadow-sm">
        {mode === "bahn" ? (
          <Train size={10} className="text-red-600" />
        ) : (
          <Car size={10} className="text-stone-600" />
        )}
        <span className="text-[10px] text-stone-600 font-medium">{minutes}min</span>
      </div>
      <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
        <span className="text-[9px] text-stone-500">{km}km</span>
      </div>
    </div>
  );
};

export default ListingsTripSidebar;
