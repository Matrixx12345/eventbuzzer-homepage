import { Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import weekendJazz from "@/assets/weekend-jazz.jpg";
import weekendOrchestra from "@/assets/weekend-orchestra.jpg";
import weekendArt from "@/assets/weekend-art.jpg";
import weekendWine from "@/assets/weekend-wine.jpg";
import weekendComedy from "@/assets/weekend-comedy.jpg";
import weekendOpera from "@/assets/weekend-opera.jpg";

interface WeekendCardProps {
  image: string;
  title: string;
  description?: string;
  venue: string;
  location: string;
  isLarge?: boolean;
  slug?: string;
}

const WeekendCard = ({ image, title, description, venue, location, isLarge = false, slug = "jazz-quartet" }: WeekendCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

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
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors z-10"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={isFavorite ? "fill-favorite text-favorite" : "text-card-foreground"}
          />
        </button>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-5">
          <span className="text-primary text-xs font-semibold tracking-wider mb-2">
            PREMIUM TYPOGRAPHY
          </span>
          <h3 className="font-serif text-card-foreground text-xl lg:text-2xl font-semibold leading-tight mb-2">
            {title}
          </h3>
          {description && isLarge && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
              {description}
            </p>
          )}
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">{venue}</p>
            <p className="text-muted-foreground text-sm">{location}</p>
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
      image: weekendJazz,
      title: "The Finezdara & Jazz Quartet Club",
      description: "Loremsum dolor sit amet, consectetur adipiscing elit. Besiamast oanoce jazz muartet, tempor anipre coinididunt. Ut wed ad minim venium, eniirt ut aliquip ex ea commode soapet.",
      venue: "Leonard House",
      location: "Baden • CH",
      slug: "jazz-quartet",
    },
    small: [
      {
        image: weekendOrchestra,
        title: "Kulturbetrieh Royal",
        venue: "Leonard House",
        location: "Baden • CH",
        slug: "kulturbetrieb-royal",
      },
      {
        image: weekendArt,
        title: "Art Eshibit Bimore",
        venue: "Tonhalla Orchestra",
        location: "Zürich • CH",
        slug: "art-exhibit",
      },
    ],
  },
  row2: [
    {
      image: weekendWine,
      title: "Freenstannee Wine & Fine Dining Event",
      description: "Temui all fus alrine co lenonnass horning os tron de chiaro vuilt nnlodor tierremasng enon peomalis nneg alrmpis, audituss nni e vtiise su ovd muse more.",
      venue: "Leonard House",
      location: "Baden • CH",
      slug: "wine-dining",
    },
    {
      image: weekendComedy,
      title: "Local Comedy Club Night",
      venue: "Leonard House",
      location: "Baden • CH",
      slug: "comedy-club",
    },
  ],
  row3: {
    small: [
      {
        image: weekendOrchestra,
        title: "Symphony Night Gala",
        venue: "Tonhalla Orchestra",
        location: "Zürich • CH",
        slug: "kulturbetrieb-royal",
      },
      {
        image: weekendArt,
        title: "Modern Art Exhibition",
        venue: "Art Gallery",
        location: "Basel • CH",
        slug: "art-exhibit",
      },
    ],
    large: {
      image: weekendOpera,
      title: "Festival: Initial Musics for Opera",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sio are du mon-in ior nuis teagor uueneen enmopsivdilder onio lui lequata veurpewne natt aliumosd evoluation.",
      venue: "Opera House",
      location: "Zürich • CH",
      slug: "opera-festival",
    },
  },
};

const WeekendSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 pb-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-muted-foreground mb-8 sm:mb-12">
          Don't Miss This Weekend
        </h2>

        {/* Complex Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-auto">
          {/* Row 1 - Left: Large Card */}
          <div className="h-[500px] lg:h-[520px]">
            <WeekendCard {...weekendEvents.row1.large} isLarge />
          </div>

          {/* Row 1 - Right: Two Stacked Cards */}
          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {weekendEvents.row1.small.map((event, index) => (
              <div key={index} className="flex-1">
                <WeekendCard {...event} />
              </div>
            ))}
          </div>

          {/* Row 2 - Two Equal Cards */}
          <div className="h-[400px]">
            <WeekendCard {...weekendEvents.row2[0]} isLarge />
          </div>
          <div className="h-[400px]">
            <WeekendCard {...weekendEvents.row2[1]} />
          </div>

          {/* Row 3 - Left: Two Stacked Cards */}
          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {weekendEvents.row3.small.map((event, index) => (
              <div key={index} className="flex-1">
                <WeekendCard {...event} />
              </div>
            ))}
          </div>

          {/* Row 3 - Right: Large Card */}
          <div className="h-[500px] lg:h-[520px]">
            <WeekendCard {...weekendEvents.row3.large} isLarge />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeekendSection;
