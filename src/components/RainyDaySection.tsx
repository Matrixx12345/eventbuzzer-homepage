import { Heart } from "lucide-react";
import { useState } from "react";

import rainyKunsthaus from "@/assets/rainy-kunsthaus.jpg";
import rainySpa from "@/assets/rainy-spa.jpg";
import rainyCinema from "@/assets/rainy-cinema.jpg";
import rainyChocolate from "@/assets/rainy-chocolate.jpg";
import rainyFifa from "@/assets/rainy-fifa.jpg";

interface RainyCardProps {
  image: string;
  title: string;
  description?: string;
  venue: string;
  location: string;
  isLarge?: boolean;
}

const RainyCard = ({ image, title, description, venue, location, isLarge = false }: RainyCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
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
        onClick={() => setIsFavorite(!isFavorite)}
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
          <button className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-md transition-colors">
            Book Now
          </button>
        )}
      </div>
    </article>
  );
};

const rainyEvents = {
  row1: {
    large: {
      image: rainyKunsthaus,
      title: "Kunsthaus Zürich",
      description: "Discover world-class art collections spanning from medieval times to contemporary masterpieces in one of Switzerland's most prestigious galleries.",
      venue: "Kunsthaus Zürich",
      location: "Zürich • CH",
    },
    small: [
      {
        image: rainySpa,
        title: "Hürlimann Spa",
        venue: "Thermalbad & Spa",
        location: "Zürich • CH",
      },
      {
        image: rainyCinema,
        title: "Kosmos Cinema",
        venue: "Kosmos Kulturhaus",
        location: "Zürich • CH",
      },
    ],
  },
  row2: [
    {
      image: rainyChocolate,
      title: "Lindt Home of Chocolate",
      description: "Experience the world's largest chocolate fountain and explore interactive exhibits showcasing the art of Swiss chocolate making.",
      venue: "Lindt Museum",
      location: "Kilchberg • CH",
    },
    {
      image: rainyFifa,
      title: "FIFA Museum",
      description: "Immerse yourself in the history of football with interactive exhibits, memorabilia, and the iconic World Cup trophy.",
      venue: "FIFA World Museum",
      location: "Zürich • CH",
    },
  ],
};

const RainyDaySection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 pb-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-muted-foreground mb-8 sm:mb-12">
          Save the Rainy Day
        </h2>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-auto">
          {/* Row 1 - Left: Large Card */}
          <div className="h-[500px] lg:h-[520px]">
            <RainyCard {...rainyEvents.row1.large} isLarge />
          </div>

          {/* Row 1 - Right: Two Stacked Cards */}
          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {rainyEvents.row1.small.map((event, index) => (
              <div key={index} className="flex-1">
                <RainyCard {...event} />
              </div>
            ))}
          </div>

          {/* Row 2 - Two Large Cards */}
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
