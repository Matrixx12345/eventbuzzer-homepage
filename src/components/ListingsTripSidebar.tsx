import { useState, lazy, Suspense } from "react";
import { useFavorites, FavoriteEvent } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Sparkles, Car, Train, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load the EventsMap for Mapbox
const EventsMap = lazy(() => import("@/components/EventsMap"));

interface ListingsTripSidebarProps {
  onEventClick?: (eventId: string) => void;
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
  
  // Get favorite IDs for map highlighting
  const favoriteIds = favorites.map(f => f.id);

  // Mock suggested events for expanded view
  const suggestedEvents = [
    { id: "1", title: "Kunsthaus Zürich", location: "Zürich", buzzScore: 87, image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=200&q=80" },
    { id: "2", title: "Rheinfall Schaffhausen", location: "Schaffhausen", buzzScore: 92, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80" },
    { id: "3", title: "Berner Altstadt", location: "Bern", buzzScore: 88, image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=200&q=80" },
    { id: "4", title: "Luzerner Kapellbrücke", location: "Luzern", buzzScore: 85, image: "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=200&q=80" },
  ];

  if (isExpanded) {
    const gridFavorites = favorites.slice(0, 6);
    
    return (
      <div className="fixed inset-0 z-[9999] bg-[#FDFBF7] overflow-auto">
        {/* X Button top right - über alles */}
        <button
          onClick={() => setIsExpanded(false)}
          className="fixed top-6 right-6 z-[10000] p-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-xl transition-all hover:scale-105"
        >
          <X size={24} className="text-stone-700" />
        </button>

        <div className="flex min-h-screen">
          {/* Left Sidebar: Vorschläge - Premium Cards mit Sandfarbenem Hintergrund */}
          <div className="w-80 bg-[hsl(var(--listings-bg))] p-6 flex-shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={18} className="text-amber-500" />
              <h3 className="font-serif font-medium text-stone-700 text-lg">Vorschläge für dich</h3>
            </div>
            <div className="space-y-4">
              {suggestedEvents.map((event) => (
                <div
                  key={event.id}
                  className="relative h-32 rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay am unteren Rand */}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm leading-tight truncate drop-shadow-lg">{event.title}</p>
                      <p className="text-white/80 text-xs mt-0.5 drop-shadow-md">{event.location}</p>
                    </div>
                    <button 
                      className="ml-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg hover:scale-105 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus size={14} className="text-stone-700" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content: Map + Timeline */}
          <div className="flex-1 p-10 pt-16 flex flex-col gap-8 overflow-y-auto">
            {/* Map - größer mit Padding oben */}
            <div className="rounded-2xl h-80 overflow-hidden shadow-xl">
              <Suspense fallback={
                <div className="w-full h-full bg-[hsl(var(--listings-bg))] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                </div>
              }>
                <EventsMap 
                  onEventClick={onEventClick}
                  onEventsChange={setMapEvents}
                  isVisible={true}
                  selectedEventIds={favoriteIds}
                />
              </Suspense>
            </div>

            {/* Transport Toggle - elegant */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTransportMode("auto")}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300",
                  transportMode === "auto"
                    ? "bg-stone-800 text-white shadow-lg"
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm border border-stone-200"
                )}
              >
                <Car size={18} />
                Auto
              </button>
              <button
                onClick={() => setTransportMode("bahn")}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300",
                  transportMode === "bahn"
                    ? "bg-stone-800 text-white shadow-lg"
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm border border-stone-200"
                )}
              >
                <Train size={18} />
                Bahn
              </button>
            </div>

            {/* Trip Timeline - Snake Grid with connecting lines */}
            {favorites.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <Heart size={40} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
                <p className="text-lg">Füge Favoriten hinzu, um deinen Trip zu planen</p>
              </div>
            ) : (
              <SnakeGrid 
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

// Snake Grid Component - with connecting lines
interface SnakeGridProps {
  favorites: FavoriteEvent[];
  transportMode: "auto" | "bahn";
  onEventClick?: (eventId: string) => void;
  onRemoveFavorite?: (id: string) => void;
}

const SnakeGrid = ({ favorites, transportMode, onEventClick, onRemoveFavorite }: SnakeGridProps) => {
  const slots = [...favorites];
  while (slots.length < 6) {
    slots.push(null as any);
  }

  // Row 1: indices 0, 1, 2 (left to right)
  // Row 2: indices 5, 4, 3 (right to left - snake pattern)
  const row1 = [slots[0], slots[1], slots[2]];
  const row2 = [slots[5], slots[4], slots[3]];

  // Mock transport data with minutes and km
  const getTransportData = (idx: number) => {
    const data = [
      { minutes: 45, km: 52 },
      { minutes: 32, km: 38 },
      { minutes: 78, km: 85 },
      { minutes: 56, km: 61 },
      { minutes: 63, km: 72 },
    ];
    return data[idx % data.length];
  };

  // Connection line with min/km labels
  const ConnectionLine = ({ index }: { index: number }) => {
    const transport = getTransportData(index);
    return (
      <div className="flex flex-col items-center mx-2">
        <span className="text-[10px] text-stone-400 font-medium mb-0.5">{transport.minutes} min</span>
        <div className="w-10 h-px bg-stone-300" />
        <span className="text-[10px] text-stone-400 mt-0.5">{transport.km} km</span>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      {/* Row 1 - bündig mit Map-Breite */}
      <div className="flex justify-between items-center w-full">
        {row1.map((fav, idx) => (
          <div key={idx} className="flex items-center">
            <SnakeCard 
              event={fav} 
              onClick={() => fav && onEventClick?.(fav.id)} 
              onRemove={() => fav && onRemoveFavorite?.(fav.id)}
            />
            {idx < 2 && row1[idx + 1] && <ConnectionLine index={idx} />}
          </div>
        ))}
      </div>

      {/* Vertical connection on the right side */}
      {row1[2] && row2[2] && (
        <div className="flex justify-end py-1">
          <div className="flex flex-col items-center mr-[calc(50%-8px)] translate-x-1/2">
            <div className="w-px h-6 bg-stone-300" />
          </div>
        </div>
      )}

      {/* Row 2 (reversed) - bündig mit Map-Breite */}
      <div className="flex justify-between items-center w-full">
        {row2.map((fav, idx) => (
          <div key={idx} className="flex items-center">
            <SnakeCard 
              event={fav} 
              onClick={() => fav && onEventClick?.(fav.id)} 
              onRemove={() => fav && onRemoveFavorite?.(fav.id)}
            />
            {idx < 2 && row2[idx] && row2[idx + 1] && <ConnectionLine index={idx + 3} />}
          </div>
        ))}
      </div>
    </div>
  );
};

// Transport Pill Component - simplified, km on hover
const TransportPill = ({ icon, duration, km }: { icon: string; label: string; duration: string; km?: string }) => (
  <div 
    className="bg-white px-3 py-2 rounded-full text-xs font-semibold text-stone-700 shadow-lg border border-stone-100 whitespace-nowrap flex items-center gap-2 cursor-default group"
    title={km ? `${km} km` : undefined}
  >
    <span className="text-base">{icon}</span>
    <span>{duration}</span>
  </div>
);

// Snake Card Component - responsive width based on container
interface SnakeCardProps {
  event: FavoriteEvent | null;
  onClick?: () => void;
  onRemove?: () => void;
}

const SnakeCard = ({ event, onClick, onRemove }: SnakeCardProps) => {
  if (!event) {
    return (
      <div className="flex-1 aspect-square max-w-[180px] rounded-xl bg-stone-100/50 border-2 border-dashed border-stone-200 flex items-center justify-center">
        <Plus size={24} className="text-stone-300" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="flex-1 aspect-square max-w-[180px] rounded-xl overflow-hidden relative cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
    >
      <img 
        src={event.image} 
        alt={event.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      
      {/* Gradient overlay am unteren Rand */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <h4 className="text-white font-medium text-xs leading-tight line-clamp-1 drop-shadow-lg">{event.title}</h4>
        <p className="text-white/80 text-[10px] flex items-center gap-0.5 mt-0.5 drop-shadow-md">
          <MapPin size={9} />
          {event.location || "Schweiz"}
        </p>
      </div>
      
      {/* Abwählbares Herz top right */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-md transition-all hover:scale-110"
      >
        <Heart size={12} className="text-red-500 fill-red-500 hover:fill-red-400 transition-colors" />
      </button>
    </div>
  );
};

export default ListingsTripSidebar;
