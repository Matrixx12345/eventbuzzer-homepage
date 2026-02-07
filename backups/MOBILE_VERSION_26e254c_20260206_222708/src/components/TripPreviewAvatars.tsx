import { useFavorites } from "@/contexts/FavoritesContext";
import { Heart } from "lucide-react";

interface TripPreviewAvatarsProps {
  onOpenPlanner: () => void;
}

const TripPreviewAvatars = ({ onOpenPlanner }: TripPreviewAvatarsProps) => {
  const { favorites } = useFavorites();
  
  if (favorites.length === 0) {
    return (
      <div 
        className="py-6 text-center cursor-pointer hover:bg-stone-50 rounded-xl transition-colors"
        onClick={onOpenPlanner}
      >
        <Heart size={36} className="mx-auto mb-2" style={{ color: '#cccccc' }} strokeWidth={1.5} />
        <p className="text-sm" style={{ color: '#999999' }}>
          Wähle Favoriten (❤️) – wir erstellen deinen Trip.
        </p>
      </div>
    );
  }

  const displayFavorites = favorites.slice(0, 3);
  const remainingCount = favorites.length - 3;

  return (
    <div 
      className="py-4 cursor-pointer hover:bg-stone-50/50 rounded-xl transition-colors"
      onClick={onOpenPlanner}
    >
      <div className="flex items-center gap-3">
        {/* Overlapping Avatars */}
        <div className="flex items-center -space-x-2">
          {displayFavorites.map((fav, idx) => (
            <div
              key={fav.id}
              className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-md"
              style={{ zIndex: 10 - idx }}
            >
              <img
                src={fav.image}
                alt={fav.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {/* Text */}
        <p className="text-sm" style={{ color: '#666666' }}>
          {remainingCount > 0 ? (
            <>
              <span className="font-medium" style={{ color: '#333333' }}>
                +{remainingCount}
              </span>
              {" weitere Ziele in deinem Plan"}
            </>
          ) : (
            <span style={{ color: '#333333' }}>
              {favorites.length} {favorites.length === 1 ? "Ziel" : "Ziele"} geplant
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default TripPreviewAvatars;
