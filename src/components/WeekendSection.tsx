import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";

import weekendJazz from "@/assets/weekend-jazz.jpg";
import weekendOrchestra from "@/assets/weekend-orchestra.jpg";
import weekendArt from "@/assets/weekend-art.jpg";
import weekendWine from "@/assets/weekend-wine.jpg";
import weekendComedy from "@/assets/weekend-comedy.jpg";
import weekendOpera from "@/assets/weekend-opera.jpg";

interface WeekendCardProps {
  id: string;
  image: string;
  title: string;
  description?: string;
  venue: string;
  location: string;
  isLarge?: boolean;
  slug?: string;
  latitude?: number; // Neu für Map
  longitude?: number; // Neu für Map
}

const WeekendCard = ({
  id,
  image,
  title,
  description,
  venue,
  location,
  isLarge = false,
  slug = "jazz-quartet",
  latitude,
  longitude,
}: WeekendCardProps) => {
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
          <span className="text-primary text-xs font-semibold tracking-wider mb-2">PREMIUM SELECTION</span>
          <h3 className="font-serif text-card-foreground text-xl lg:text-2xl font-semibold leading-tight mb-2 line-clamp-2">
            {title}
          </h3>
          {description && isLarge && <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{description}</p>}
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">{venue}</p>

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
                        className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm shadow-black/50"
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
            <span className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-md transition-colors">
              Book Now
            </span>
          )}
        </div>
      </article>
    </Link>
  );
};

const weekendEvents = {
  row1: {
    large: {
      id: "weekend-jazz",
      image: weekendJazz,
      title: "The Finezdara & Jazz Quartet Club",
      description:
        "Loremsum dolor sit amet, consectetur adipiscing elit. Besiamast oanoce jazz muartet, tempor anipre coinididunt.",
      venue: "Leonard House",
      location: "Baden (AG)",
      slug: "jazz-quartet",
      latitude: 47.4733,
      longitude: 8.3081,
    },
    small: [
      {
        id: "weekend-orchestra",
        image: weekendOrchestra,
        title: "Kulturbetrieb Royal",
        venue: "Leonard House",
        location: "Baden (AG)",
        slug: "kulturbetrieb-royal",
        latitude: 47.4733,
        longitude: 8.3081,
      },
      {
        id: "weekend-art",
        image: weekendArt,
        title: "Art Exhibit Bimore",
        venue: "Tonhalle Orchestra",
        location: "Zürich (ZH)",
        slug: "art-exhibit",
        latitude: 47.3769,
        longitude: 8.5417,
      },
    ],
  },
  row2: [
    {
      id: "weekend-wine",
      image: weekendWine,
      title: "Wine & Fine Dining Event",
      description:
        "Temui all fus alrine co lenonnass horning os tron de chiaro vuilt nnlodor tierremasng enon peomalis nneg alrmpis.",
      venue: "Leonard House",
      location: "Baden (AG)",
      slug: "wine-dining",
      latitude: 47.4733,
      longitude: 8.3081,
    },
    {
      id: "weekend-comedy",
      image: weekendComedy,
      title: "Local Comedy Club Night",
      venue: "Leonard House",
      location: "Baden (AG)",
      slug: "comedy-club",
      latitude: 47.4733,
      longitude: 8.3081,
    },
  ],
  row3: {
    small: [
      {
        id: "weekend-symphony",
        image: weekendOrchestra,
        title: "Symphony Night Gala",
        venue: "Tonhalle Orchestra",
        location: "Zürich (ZH)",
        slug: "kulturbetrieb-royal",
        latitude: 47.3769,
        longitude: 8.5417,
      },
      {
        id: "weekend-modern-art",
        image: weekendArt,
        title: "Modern Art Exhibition",
        venue: "Art Gallery",
        location: "Basel (BS)",
        slug: "art-exhibit",
        latitude: 47.5596,
        longitude: 7.5886,
      },
    ],
    large: {
      id: "weekend-opera",
      image: weekendOpera,
      title: "Festival: Initial Musics for Opera",
      description:
        "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sio are du mon-in ior nuis teagor uueneen enmopsivdilder.",
      venue: "Opera House",
      location: "Zürich (ZH)",
      slug: "opera-festival",
      latitude: 47.3769,
      longitude: 8.5417,
    },
  },
};

const WeekendSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 pb-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-muted-foreground mb-8 sm:mb-12">
          Don't Miss This Weekend
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-auto">
          <div className="h-[500px] lg:h-[520px]">
            <WeekendCard {...weekendEvents.row1.large} isLarge />
          </div>

          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {weekendEvents.row1.small.map((event, index) => (
              <div key={index} className="flex-1">
                <WeekendCard {...event} />
              </div>
            ))}
          </div>

          <div className="h-[400px]">
            <WeekendCard {...weekendEvents.row2[0]} isLarge />
          </div>
          <div className="h-[400px]">
            <WeekendCard {...weekendEvents.row2[1]} />
          </div>

          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {weekendEvents.row3.small.map((event, index) => (
              <div key={index} className="flex-1">
                <WeekendCard {...event} />
              </div>
            ))}
          </div>

          <div className="h-[500px] lg:h-[520px]">
            <WeekendCard {...weekendEvents.row3.large} isLarge />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeekendSection;
