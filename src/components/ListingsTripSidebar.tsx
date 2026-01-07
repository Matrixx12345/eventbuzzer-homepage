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
      <div className="fixed inset-0 z-[100] bg-[hsl(var(--listings-bg))] overflow-auto">
        {/* X Button top right */}
        <button
          onClick={() => setIsExpanded(false)}
          className="fixed top-6 right-6 z-50 p-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-colors"
        >
          <X size={22} className="text-stone-600" />
        </button>

        <div className="flex h-full">
          {/* Left Sidebar: Vorschläge - elegant cards */}
          <div className="w-72 bg-white/60 backdrop-blur-sm p-6 flex-shrink-0 overflow-y-auto border-r border-stone-200/50">
            <div className="flex items-center gap-2.5 mb-6">
              <Sparkles size={20} className="text-amber-500" />
              <h3 className="font-serif font-semibold text-stone-800 text-xl">Vorschläge</h3>
            </div>
            <div className="space-y-4">
              {suggestedEvents.map((event) => (
                <div
                  key={event.id}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <p className="text-white font-semibold text-sm leading-tight">{event.title}</p>
                    <p className="text-white/60 text-xs mt-1">{event.location} · Buzz {event.buzzScore}</p>
                  </div>
                  <button className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/95 hover:bg-white transition-colors shadow-md hover:scale-110">
                    <Plus size={14} className="text-stone-700" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content: Map + Timeline */}
          <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
            {/* Map - larger */}
            <div className="rounded-2xl h-80 overflow-hidden shadow-lg">
              <Suspense fallback={
                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                </div>
              }>
                <EventsMap 
                  onEventClick={onEventClick}
                  onEventsChange={setMapEvents}
                  isVisible={true}
                />
              </Suspense>
            </div>

            {/* Transport Toggle - elegant */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTransportMode("auto")}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300",
                  transportMode === "auto"
                    ? "bg-stone-800 text-white shadow-lg"
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm"
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
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm"
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

  // Collapsed State - von oben bis unten, Map höher
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200/80 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-stone-100">
        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-0.5">Trip Composer</p>
        <h3 className="font-serif font-bold text-stone-900 text-lg">Dein Trip-Entwurf</h3>
      </div>

      {/* Map - HÖHER (nicht so querformat) */}
      <div className="h-56 relative overflow-hidden flex-shrink-0">
        <Suspense fallback={
          <div className="w-full h-full bg-stone-50 flex items-center justify-center">
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
          />
        </Suspense>
      </div>

      {/* Favorites List or Empty State - flex-1 to fill remaining space */}
      <div className="p-4 flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart size={48} className="text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-stone-500 leading-relaxed">
              Wähle Favoriten (❤️) – wir erstellen deinen perfekten Ablauf.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.slice(0, 5).map((fav) => (
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
            {favorites.length > 5 && (
              <p className="text-xs text-stone-400 text-center pt-2">
                +{favorites.length - 5} weitere
              </p>
            )}
          </div>
        )}
      </div>

      {/* Plan Button - always at bottom */}
      <div className="p-4 pt-0 mt-auto">
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

  const getTransportPill = (idx: number) => {
    const opt = transportOptions[idx % transportOptions.length];
    const icon = transportMode === "bahn" ? "🚆" : "🚗";
    return { icon, label: opt.label, duration: opt.duration };
  };

  return (
    <div className="relative">
      {/* Row 1 */}
      <div className="flex justify-center items-center gap-0">
        {row1.map((fav, idx) => (
          <div key={idx} className="flex items-center">
            <SnakeCard 
              event={fav} 
              onClick={() => fav && onEventClick?.(fav.id)} 
              onRemove={() => fav && onRemoveFavorite?.(fav.id)}
            />
            
            {/* Connection line + transport pill */}
            {idx < 2 && (
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-stone-300" />
                <TransportPill {...getTransportPill(idx)} />
                <div className="w-8 h-0.5 bg-stone-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Vertical connection on the right side */}
      {row1[2] && row2[2] && (
        <div className="flex justify-end pr-[calc(16.67%-28px)] py-2">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-stone-300" />
            <TransportPill {...getTransportPill(2)} />
            <div className="w-0.5 h-6 bg-stone-300" />
          </div>
        </div>
      )}

      {/* Row 2 (reversed) */}
      <div className="flex justify-center items-center gap-0">
        {row2.map((fav, idx) => (
          <div key={idx} className="flex items-center">
            <SnakeCard 
              event={fav} 
              onClick={() => fav && onEventClick?.(fav.id)} 
              onRemove={() => fav && onRemoveFavorite?.(fav.id)}
            />
            
            {/* Connection line + transport pill (reversed direction) */}
            {idx < 2 && row2[idx] && row2[idx + 1] && (
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-stone-300" />
                <TransportPill {...getTransportPill(3 + idx)} />
                <div className="w-8 h-0.5 bg-stone-300" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Transport Pill Component - elegant centered between lines
const TransportPill = ({ icon, label, duration }: { icon: string; label: string; duration: string }) => (
  <div className="bg-white px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 shadow-md border border-stone-100 whitespace-nowrap flex items-center gap-1.5">
    <span>{icon}</span>
    <span className="text-stone-500">{label}</span>
    <span className="text-stone-400">|</span>
    <span className="text-stone-700">{duration}</span>
  </div>
);

// Snake Card Component - LARGER square cards
interface SnakeCardProps {
  event: FavoriteEvent | null;
  onClick?: () => void;
  onRemove?: () => void;
}

const SnakeCard = ({ event, onClick, onRemove }: SnakeCardProps) => {
  if (!event) {
    return (
      <div className="w-48 h-48 rounded-2xl bg-stone-100/50 border-2 border-dashed border-stone-200 flex items-center justify-center">
        <Plus size={28} className="text-stone-300" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="w-48 h-48 rounded-2xl overflow-hidden relative cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <img 
        src={event.image} 
        alt={event.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2">{event.title}</h4>
        <div className="flex items-center justify-between mt-2">
          <p className="text-white/70 text-xs flex items-center gap-1">
            <MapPin size={11} />
            {event.location || "Schweiz"}
          </p>
          <p className="text-white/60 text-xs">Buzz {Math.round(Math.random() * 30 + 60)}</p>
        </div>
      </div>
      
      {/* Abwählbares Herz top right */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
      >
        <Heart size={16} className="text-white fill-red-500 hover:fill-red-400 transition-colors" />
      </button>
    </div>
  );
};

export default ListingsTripSidebar;
