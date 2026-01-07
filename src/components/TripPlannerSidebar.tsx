import { useState } from "react";
import { Heart, ChevronLeft, ChevronRight, MapPin, Train, Car, X, Sparkles } from "lucide-react";
import { useFavorites, FavoriteEvent } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

interface TripPlannerSidebarProps {
  onEventClick?: (eventId: string) => void;
}

const TripPlannerSidebar = ({ onEventClick }: TripPlannerSidebarProps) => {
  const { favorites, removeFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<"car" | "train">("train");

  // Mock travel times (in a real app, these would come from an API)
  const getTravelTime = (index: number): string => {
    const times = ["24 min", "1h 05m", "45 min", "1h 50m", "32 min", "55 min"];
    return times[index % times.length];
  };

  const getTrainLine = (index: number): string => {
    const lines = ["S3", "IC 8", "IR 50", "RE", "S12", "IC 1"];
    return lines[index % lines.length];
  };

  if (!isExpanded) {
    // Collapsed sidebar
    return (
      <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-32 h-fit">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Map Placeholder */}
          <div className="h-48 bg-gradient-to-br from-emerald-100 to-sky-100 relative flex items-center justify-center">
            <div className="text-center text-foreground/40">
              <MapPin size={32} className="mx-auto mb-2" />
              <span className="text-xs">Mapbox Karte</span>
            </div>
            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Trip Composer Header */}
          <div className="p-4 border-b border-border">
            <span className="text-xs text-foreground/50 font-medium tracking-wide uppercase">Trip Composer</span>
            <h3 className="font-serif text-xl font-semibold text-foreground">Dein Trip-Entwurf</h3>
          </div>

          {/* Favorites List or Empty State */}
          <div className="p-4">
            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <Heart size={40} className="text-red-300" />
                </div>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  Wähle Favoriten (<Heart size={12} className="inline text-red-500" />) – wir erstellen deinen perfekten Ablauf.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {favorites.slice(0, 5).map((fav) => (
                  <FavoriteItem 
                    key={fav.id} 
                    event={fav} 
                    onRemove={() => removeFavorite(fav.id)}
                    onClick={() => onEventClick?.(fav.id)}
                  />
                ))}
                {favorites.length > 5 && (
                  <p className="text-xs text-foreground/50 text-center pt-2">
                    +{favorites.length - 5} weitere
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Plan Button */}
          {favorites.length > 0 && (
            <div className="p-4 pt-0">
              <button 
                onClick={() => setIsExpanded(true)}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-amber-500 hover:to-orange-500 transition-all shadow-sm"
              >
                Ablauf jetzt planen
                <Sparkles size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // Expanded view - Full Trip Timeline
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs text-foreground/50 font-medium tracking-wide uppercase">Trip Composer</span>
            <h2 className="font-serif text-2xl font-semibold text-foreground">Dein Trip-Entwurf</h2>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-6">
          {/* Left: Suggestions (narrow) */}
          <div className="w-72 flex-shrink-0">
            <h3 className="font-serif text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              Vorschläge für dich
              <Sparkles size={16} className="text-amber-500" />
            </h3>
            <div className="space-y-3">
              {/* Mock suggestions - would come from recommendations */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-2 bg-white rounded-xl border border-border hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">Event Suggestion {i}</h4>
                    <p className="text-xs text-foreground/50">Ort, Schweiz · Buzz {60 + i * 5}</p>
                  </div>
                  <button className="p-1.5 hover:bg-muted rounded-full">
                    <Heart size={14} className="text-foreground/40" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map + Timeline */}
          <div className="flex-1">
            {/* Map */}
            <div className="h-64 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-2xl mb-4 relative flex items-center justify-center">
              <div className="text-center text-foreground/40">
                <MapPin size={48} className="mx-auto mb-2" />
                <span className="text-sm">Interaktive Mapbox Karte</span>
              </div>
            </div>

            {/* Transport Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex bg-muted rounded-full p-1">
                <button
                  onClick={() => setTransportMode("car")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    transportMode === "car" ? "bg-white shadow-sm text-foreground" : "text-foreground/60"
                  )}
                >
                  <Car size={16} />
                  Auto
                </button>
                <button
                  onClick={() => setTransportMode("train")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    transportMode === "train" ? "bg-white shadow-sm text-foreground" : "text-foreground/60"
                  )}
                >
                  <Train size={16} />
                  Bahn
                </button>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Trip Timeline - Snake Layout */}
            {favorites.length > 0 ? (
              <div className="relative">
                {/* Top Row */}
                <div className="flex gap-4">
                  {favorites.slice(0, 3).map((fav, index) => (
                    <div key={fav.id} className="flex items-center">
                      <TimelineCard 
                        event={fav} 
                        onClick={() => onEventClick?.(fav.id)}
                      />
                      {index < Math.min(2, favorites.length - 1) && (
                        <ConnectionPill 
                          mode={transportMode}
                          line={getTrainLine(index)}
                          time={getTravelTime(index)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Vertical connection on right side */}
                {favorites.length > 3 && (
                  <div className="flex justify-end pr-20 my-2">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-8 bg-border" />
                      <ConnectionPill 
                        mode={transportMode}
                        line={getTrainLine(2)}
                        time={getTravelTime(2)}
                        vertical
                      />
                      <div className="w-0.5 h-8 bg-border" />
                    </div>
                  </div>
                )}

                {/* Bottom Row (reversed) */}
                {favorites.length > 3 && (
                  <div className="flex gap-4 flex-row-reverse">
                    {favorites.slice(3, 6).map((fav, index) => (
                      <div key={fav.id} className="flex items-center flex-row-reverse">
                        <TimelineCard 
                          event={fav} 
                          onClick={() => onEventClick?.(fav.id)}
                        />
                        {index < Math.min(2, favorites.slice(3).length - 1) && (
                          <ConnectionPill 
                            mode={transportMode}
                            line={getTrainLine(index + 3)}
                            time={getTravelTime(index + 3)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart size={48} className="mx-auto mb-4 text-red-200" />
                <p className="text-foreground/50">Füge Favoriten hinzu, um deinen Trip zu planen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const FavoriteItem = ({ 
  event, 
  onRemove, 
  onClick 
}: { 
  event: FavoriteEvent; 
  onRemove: () => void;
  onClick: () => void;
}) => (
  <div 
    className="flex items-center gap-3 p-2 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors"
    onClick={onClick}
  >
    <img 
      src={event.image} 
      alt={event.title} 
      className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
    />
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-sm text-foreground truncate">{event.title}</h4>
      <p className="text-xs text-foreground/50 truncate">{event.location}</p>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="p-1 hover:bg-white rounded-full"
    >
      <X size={14} className="text-foreground/40" />
    </button>
  </div>
);

const TimelineCard = ({ 
  event, 
  onClick 
}: { 
  event: FavoriteEvent;
  onClick: () => void;
}) => (
  <div 
    onClick={onClick}
    className="w-40 bg-white rounded-xl border border-border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all flex-shrink-0"
  >
    <img 
      src={event.image} 
      alt={event.title} 
      className="w-full h-24 object-cover" 
    />
    <div className="p-2">
      <h4 className="font-medium text-sm text-foreground truncate">{event.title}</h4>
      <p className="text-xs text-foreground/50 truncate">{event.location}</p>
    </div>
  </div>
);

const ConnectionPill = ({ 
  mode, 
  line, 
  time,
  vertical = false
}: { 
  mode: "car" | "train";
  line: string;
  time: string;
  vertical?: boolean;
}) => (
  <div className={cn(
    "flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full text-xs font-medium text-foreground/70 whitespace-nowrap",
    vertical && "rotate-0"
  )}>
    {mode === "train" ? <Train size={12} /> : <Car size={12} />}
    <span>{mode === "train" ? line : ""}</span>
    <span className="text-foreground/50">|</span>
    <span>{time}</span>
  </div>
);

export default TripPlannerSidebar;
