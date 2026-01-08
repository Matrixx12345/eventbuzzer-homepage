import { useState, lazy, Suspense, useEffect } from "react";
import { useFavorites, FavoriteEvent } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Sparkles, Car, Train, X, Plus, Loader2 } from "lucide-react";
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
}

// Transport pills data for snake connections
const transportOptions = [
  { label: "IC 8", duration: "5h 12m" },
  { label: "S3", duration: "24m" },
  { label: "IR 50", duration: "1h 05m" },
  { label: "PE", duration: "1h 50m" },
  { label: "IC 3", duration: "45m" },
];

const ListingsTripSidebar = ({ onEventClick }: ListingsTripSidebarProps) => {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<"auto" | "bahn">("bahn");
  const [, setMapEvents] = useState<any[]>([]);
  const [favoriteEventsWithCoords, setFavoriteEventsWithCoords] = useState<FavoriteWithCoords[]>([]);
  
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
                title: e.title
              });
            }
          });

          // Map favorites to include coordinates
          const withCoords = favorites.map(f => ({
            id: f.id,
            latitude: coordsMap.get(f.id)?.latitude,
            longitude: coordsMap.get(f.id)?.longitude,
            title: f.title
          })).filter(f => f.latitude && f.longitude);

          setFavoriteEventsWithCoords(withCoords);
          console.log(`Fetched coords for ${withCoords.length} favorites`);
        }
      } catch (err) {
        console.error('Failed to fetch favorite coords:', err);
      }
    };

    fetchFavoriteCoords();
  }, [favorites, favoriteIds]);

  // Mock suggested events for expanded view
  const suggestedEvents = [
    { id: "1", title: "Kunsthaus Zürich", location: "Zürich", buzzScore: 87, image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=200&q=80" },
    { id: "2", title: "Rheinfall Schaffhausen", location: "Schaffhausen", buzzScore: 92, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80" },
    { id: "3", title: "Berner Altstadt", location: "Bern", buzzScore: 88, image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=200&q=80" },
    { id: "4", title: "Luzerner Kapellbrücke", location: "Luzern", buzzScore: 85, image: "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=200&q=80" },
  ];

  if (isExpanded) {
    const gridFavorites = favorites.slice(0, 8); // Support up to 8 cards for snake pattern
    
    return (
      <div className="fixed inset-0 z-[9999] bg-[#FDFBF7] overflow-auto">
        {/* X Button top right */}
        <button
          onClick={() => setIsExpanded(false)}
          className="fixed top-6 right-6 z-[10000] p-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-xl transition-all hover:scale-105"
        >
          <X size={24} className="text-stone-700" />
        </button>

        <div className="flex min-h-screen p-10 gap-8">
          {/* LEFT HALF: Map + Suggestions */}
          <div className="w-[42%] flex flex-col pt-14">
            {/* Map - 15% smaller, top aligned with first event cards */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-stone-200/60 h-[420px]">
              <Suspense fallback={
                <div className="w-full h-full bg-[#F5F3EF] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
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

            {/* Suggestions at bottom of left side */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="font-medium text-stone-500 text-sm tracking-wide uppercase">Vorschläge für dich</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {suggestedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 flex gap-4 cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-300 border border-stone-100/80 hover:border-stone-200"
                  >
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-stone-800 font-medium text-sm leading-tight truncate">{event.title}</p>
                      <p className="text-stone-400 text-xs mt-1.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {event.location}
                      </p>
                    </div>
                    <button 
                      className="self-center p-2.5 rounded-full bg-stone-100/80 hover:bg-amber-100 hover:text-amber-600 transition-all flex-shrink-0 group-hover:scale-105"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus size={14} className="text-stone-500 group-hover:text-amber-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT HALF: Trip Grid with Snake Pattern */}
          <div className="w-[58%] flex flex-col">
            {/* Transport Toggle - same height as map padding to align */}
            <div className="flex items-center gap-3 h-14 mb-0">
              <button
                onClick={() => setTransportMode("auto")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  transportMode === "auto"
                    ? "bg-stone-800 text-white shadow-md"
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm border border-stone-200"
                )}
              >
                <Car size={16} />
                Auto
              </button>
              <button
                onClick={() => setTransportMode("bahn")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  transportMode === "bahn"
                    ? "bg-stone-800 text-white shadow-md"
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm border border-stone-200"
                )}
              >
                <Train size={16} />
                Bahn
              </button>
            </div>

            {/* Trip Grid - Snake Pattern */}
            <div className="flex-1">
              {favorites.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <Heart size={40} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
                  <p className="text-lg">Füge Favoriten hinzu, um deinen Trip zu planen</p>
                </div>
              ) : (
                <SnakeTripGrid 
                  favorites={gridFavorites} 
                  transportMode={transportMode}
                  onEventClick={onEventClick}
                  onRemoveFavorite={(id) => {
                    const fav = favorites.find(f => f.id === id);
                    if (fav) toggleFavorite(fav);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed State - KEIN internes Scrolling, Content fließt normal
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200/80 overflow-visible">
      {/* Map - QUADRATISCH bündig oben */}
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

      {/* Favorites List or Empty State - KEIN overflow-y-auto, normaler Flow */}
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
                {/* Abwählbares Herz */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(fav);
                  }}
                  className="flex-shrink-0 p-1.5 hover:scale-110 transition-transform"
                  aria-label="Remove from favorites"
                >
                  <Heart 
                    size={16} 
                    className="text-red-500 fill-red-500 hover:fill-red-400 hover:text-red-400 transition-colors" 
                  />
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

// Snake Trip Grid Component - 2 columns with snake pattern connections
interface SnakeTripGridProps {
  favorites: FavoriteEvent[];
  transportMode: "auto" | "bahn";
  onEventClick?: (eventId: string) => void;
  onRemoveFavorite?: (id: string) => void;
}

const SnakeTripGrid = ({ favorites, onEventClick, onRemoveFavorite }: SnakeTripGridProps) => {
  // Fill to 8 slots for 4 rows of 2
  const slots: (FavoriteEvent | null)[] = [...favorites];
  while (slots.length < 8) {
    slots.push(null);
  }

  // Mock transport data for connections
  const transportData = [
    { minutes: 45, km: 52 },  // 1 -> 2 (horizontal)
    { minutes: 32, km: 38 },  // 2 -> 3 (vertical down)
    { minutes: 28, km: 31 },  // 3 -> 4 (horizontal)
    { minutes: 63, km: 72 },  // 4 -> 5 (vertical down)
    { minutes: 55, km: 64 },  // 5 -> 6 (horizontal)
    { minutes: 41, km: 48 },  // 6 -> 7 (vertical down)
    { minutes: 37, km: 42 },  // 7 -> 8 (horizontal)
  ];

  // Rows: alternating left-to-right and right-to-left
  // Row 0: 0, 1 (left to right) - horizontal line between 0->1
  // Row 1: 3, 2 (right to left, but stored as 2,3) - vertical from 1->2, horizontal 2->3
  // Row 2: 4, 5 (left to right) - vertical from 3->4, horizontal 4->5
  // Row 3: 7, 6 (right to left) - vertical from 5->6, horizontal 6->7

  return (
    <div className="flex flex-col gap-0">
      {/* Row 1: Cards 1 & 2 (indices 0, 1) - left to right */}
      <div className="flex items-center">
        <div className="flex-1 relative">
          <TripCard 
            event={slots[0]} 
            onClick={() => slots[0] && onEventClick?.(slots[0].id)} 
            onRemove={() => slots[0] && onRemoveFavorite?.(slots[0].id)}
          />
          {/* Line extending from card edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
        </div>
        {/* Horizontal connection 1->2 - Linien berühren Karten */}
        <div className="w-12 flex items-center justify-center relative -mx-1">
          <div className="w-full h-[2px] bg-stone-300" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-600 font-medium">{transportData[0].minutes}m</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-500">{transportData[0].km}km</span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          {/* Line extending to card edge */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
          <TripCard 
            event={slots[1]} 
            onClick={() => slots[1] && onEventClick?.(slots[1].id)}
            onRemove={() => slots[1] && onRemoveFavorite?.(slots[1].id)}
          />
        </div>
      </div>

      {/* Vertical connection 2->3 (on the right side) */}
      <div className="flex">
        <div className="flex-1" />
        <div className="w-12 -mx-1" />
        <div className="flex-1 flex justify-center relative py-1">
          <div className="w-[2px] h-10 bg-stone-300" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-0.5">
              <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
                <span className="text-[10px] text-stone-600 font-medium">{transportData[1].minutes}m</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
                <span className="text-[10px] text-stone-500">{transportData[1].km}km</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Cards 3 & 4 (indices 2, 3) - right to left (reversed display) */}
      <div className="flex items-center">
        <div className="flex-1 relative">
          <TripCard 
            event={slots[3]} 
            onClick={() => slots[3] && onEventClick?.(slots[3].id)} 
            onRemove={() => slots[3] && onRemoveFavorite?.(slots[3].id)}
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
        </div>
        {/* Horizontal connection 3->4 */}
        <div className="w-12 flex items-center justify-center relative -mx-1">
          <div className="w-full h-[2px] bg-stone-300" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-600 font-medium">{transportData[2].minutes}m</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-500">{transportData[2].km}km</span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
          <TripCard 
            event={slots[2]} 
            onClick={() => slots[2] && onEventClick?.(slots[2].id)} 
            onRemove={() => slots[2] && onRemoveFavorite?.(slots[2].id)}
          />
        </div>
      </div>

      {/* Vertical connection 4->5 (on the left side) */}
      <div className="flex">
        <div className="flex-1 flex justify-center relative py-1">
          <div className="w-[2px] h-10 bg-stone-300" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-0.5">
              <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
                <span className="text-[10px] text-stone-600 font-medium">{transportData[3].minutes}m</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
                <span className="text-[10px] text-stone-500">{transportData[3].km}km</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-12 -mx-1" />
        <div className="flex-1" />
      </div>

      {/* Row 3: Cards 5 & 6 (indices 4, 5) - left to right */}
      <div className="flex items-center">
        <div className="flex-1 relative">
          <TripCard 
            event={slots[4]} 
            onClick={() => slots[4] && onEventClick?.(slots[4].id)} 
            onRemove={() => slots[4] && onRemoveFavorite?.(slots[4].id)}
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
        </div>
        {/* Horizontal connection 5->6 */}
        <div className="w-12 flex items-center justify-center relative -mx-1">
          <div className="w-full h-[2px] bg-stone-300" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-600 font-medium">{transportData[4].minutes}m</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-500">{transportData[4].km}km</span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
          <TripCard 
            event={slots[5]} 
            onClick={() => slots[5] && onEventClick?.(slots[5].id)} 
            onRemove={() => slots[5] && onRemoveFavorite?.(slots[5].id)}
          />
        </div>
      </div>

      {/* Vertical connection 6->7 (on the right side) */}
      <div className="flex">
        <div className="flex-1" />
        <div className="w-12 -mx-1" />
        <div className="flex-1 flex justify-center relative py-1">
          <div className="w-[2px] h-10 bg-stone-300" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-0.5">
              <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
                <span className="text-[10px] text-stone-600 font-medium">{transportData[5].minutes}m</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
                <span className="text-[10px] text-stone-500">{transportData[5].km}km</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Cards 7 & 8 (indices 6, 7) - right to left */}
      <div className="flex items-center">
        <div className="flex-1 relative">
          <TripCard 
            event={slots[7]} 
            onClick={() => slots[7] && onEventClick?.(slots[7].id)} 
            onRemove={() => slots[7] && onRemoveFavorite?.(slots[7].id)}
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
        </div>
        {/* Horizontal connection 7->8 */}
        <div className="w-12 flex items-center justify-center relative -mx-1">
          <div className="w-full h-[2px] bg-stone-300" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-600 font-medium">{transportData[6].minutes}m</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/50 shadow-sm">
              <span className="text-[10px] text-stone-500">{transportData[6].km}km</span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[10%] h-[2px] bg-stone-300" />
          <TripCard 
            event={slots[6]} 
            onClick={() => slots[6] && onEventClick?.(slots[6].id)} 
            onRemove={() => slots[6] && onRemoveFavorite?.(slots[6].id)}
          />
        </div>
      </div>
    </div>
  );
};

// Trip Card Component - 30% bigger
interface TripCardProps {
  event: FavoriteEvent | null;
  onClick?: () => void;
  onRemove?: () => void;
}

const TripCard = ({ event, onClick, onRemove }: TripCardProps) => {
  if (!event) {
    return (
      <div className="w-[80%] mx-auto aspect-[4/3] rounded-2xl bg-stone-100/30 border-2 border-dashed border-stone-200/60 flex items-center justify-center flex-shrink-0">
        <Plus size={20} className="text-stone-300" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="w-[80%] mx-auto aspect-[4/3] rounded-2xl overflow-hidden relative cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-300 flex-shrink-0"
    >
      <img 
        src={event.image} 
        alt={event.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      
      {/* Frosted glass overlay on bottom ~1/4 */}
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-white/20 backdrop-blur-md border-t border-white/30" />
      
      {/* Content on frosted glass */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <h4 className="text-white font-semibold text-sm leading-tight line-clamp-1 drop-shadow-lg">{event.title}</h4>
        <p className="text-white/90 text-xs flex items-center gap-1 mt-1 drop-shadow-md">
          <MapPin size={10} />
          {event.location || "Schweiz"}
        </p>
      </div>
      
      {/* Heart button top right */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-all hover:scale-110"
      >
        <Heart size={12} className="text-red-500 fill-red-500 hover:fill-red-400 transition-colors" />
      </button>
    </div>
  );
};

export default ListingsTripSidebar;
