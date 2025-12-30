import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";

import rainyKunsthaus from "@/assets/rainy-kunsthaus.jpg";
import rainySpa from "@/assets/rainy-spa.jpg";
import rainyCinema from "@/assets/rainy-cinema.jpg";
import rainyChocolate from "@/assets/rainy-chocolate.jpg";
import rainyFifa from "@/assets/rainy-fifa.jpg";

interface RainyCardProps {
  id: string;
  image: string;
  title: string;
  description?: string;
  venue: string;
  location: string;
  isLarge?: boolean;
  slug: string;
  latitude?: number;
  longitude?: number;
}

const RainyCard = ({
  id,
  image,
  title,
  description,
  venue,
  location,
  isLarge = false,
  slug,
  latitude,
  longitude,
}: RainyCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(id);

  return (
    <Link to={`/event/${slug}`} className="block h-full">
      <article className="relative h-full bg-card rounded-2xl overflow-hidden group">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/60 to-transparent" />
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite({ id, slug, image, title, venue, location });
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors z-10"
          aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={20} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-card-foreground"} />
        </button>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-5">
          <span className="text-primary text-[10px] font-semibold tracking-wider mb-2 uppercase">Indoor Highlight</span>
          <h3 className="font-serif text-card-foreground text-xl lg:text-2xl font-semibold leading-tight mb-2 line-clamp-2">
            {title}
          </h3>

          {description && isLarge && <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>}

          <div className="mb-4">
            <p className="text-muted-foreground text-sm truncate">{venue}</p>

            {/* Location mit Mini-Map Hover */}
            <div className="group/map relative inline-flex items-center gap-1 text-muted-foreground text-sm cursor-help">
              <span className="text-red-500">📍</span>
              <span className="border-b border-dotted border-muted-foreground/50 hover:text-white transition-colors">
                {location}
              </span>

              {/* MINI-MAP TOOLTIP */}
              <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-40 h-28 overflow-hidden flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                    {latitude && longitude && (
                      <div
                        className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm"
                        style={{
                          left: `${((longitude - 5.9) / (10.5 - 5.9)) * 100}%`,
                          top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
              </div>
            </div>
          </div>

          {isLarge && (
            <span className="w-fit border border-primary text-primary hover:bg-primary hover:text-white font-semibold px-6 py-2 rounded-md transition-all text-sm">
              Details ansehen
            </span>
          )}
        </div>
      </article>
    </Link>
  );
};

const rainyEvents = {
  row1: {
    large: {
      id: "rainy-kunsthaus",
      image: rainyKunsthaus,
      title: "Kunsthaus Zürich",
      description: "Weltklasse-Kunstsammlungen vom Mittelalter bis zur Gegenwart.",
      venue: "Kunsthaus Zürich",
      location: "Zürich (ZH)",
      slug: "kunsthaus-zurich",
      latitude: 47.3703,
      longitude: 8.5481,
    },
    small: [
      {
        id: "rainy-spa",
        image: rainySpa,
        title: "Hürlimann Thermalbad & Spa",
        venue: "Thermalbad & Spa",
        location: "Zürich (ZH)",
        slug: "hurlimann-spa",
        latitude: 47.3631,
        longitude: 8.5285,
      },
      {
        id: "rainy-cinema",
        image: rainyCinema,
        title: "Kosmos Cinema",
        venue: "Kosmos Kulturhaus",
        location: "Zürich (ZH)",
        slug: "kosmos-cinema",
        latitude: 47.3792,
        longitude: 8.5297,
      },
    ],
  },
  row2: [
    {
      id: "rainy-chocolate",
      image: rainyChocolate,
      title: "Lindt Home of Chocolate",
      description: "Erlebe den größten Schokoladenbrunnen der Welt.",
      venue: "Lindt Museum",
      location: "Kilchberg (ZH)",
      slug: "lindt-chocolate",
      latitude: 47.3223,
      longitude: 8.5518,
    },
    {
      id: "rainy-fifa",
      image: rainyFifa,
      title: "FIFA Museum",
      description: "Tauche ein in die Geschichte des Fußballs.",
      venue: "FIFA World Museum",
      location: "Zürich (ZH)",
      slug: "fifa-museum",
      latitude: 47.3631,
      longitude: 8.5311,
    },
  ],
};

const RainyDaySection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 pb-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-muted-foreground mb-8 sm:mb-12 italic">
          Rette den Regentag
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-auto">
          <div className="h-[500px] lg:h-[520px]">
            <RainyCard {...rainyEvents.row1.large} isLarge />
          </div>

          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {rainyEvents.row1.small.map((event, index) => (
              <div key={index} className="flex-1">
                <RainyCard {...event} />
              </div>
            ))}
          </div>

          <div className="h-[400px]">
            <RainyCard {...rainyEvents.row2[0]} isLarge />
          </div>
          <div className="h-[400px]">
            <RainyCard {...rainyEvents.row2[1]} isLarge />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RainyDaySection;
