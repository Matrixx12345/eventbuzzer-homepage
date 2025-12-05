import { Heart, Flame } from "lucide-react";
import { useState } from "react";

interface EventCardProps {
  image: string;
  title: string;
  venue: string;
  location: string;
  isPopular?: boolean;
}

const EventCard = ({ image, title, venue, location, isPopular = false }: EventCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <Flame size={14} />
            <span>POPULAR</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={isFavorite ? "fill-favorite text-favorite" : "text-card-foreground"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{venue}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
      </div>
    </article>
  );
};

export default EventCard;
