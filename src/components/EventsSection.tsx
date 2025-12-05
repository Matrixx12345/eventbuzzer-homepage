import { Button } from "@/components/ui/button";

import todayJazz from "@/assets/today-jazz.jpg";
import todayRooftop from "@/assets/today-rooftop.jpg";
import todayComedy from "@/assets/today-comedy.jpg";
import todayStreetfood from "@/assets/today-streetfood.jpg";
import todayTheater from "@/assets/today-theater.jpg";
import todayTechno from "@/assets/today-techno.jpg";
import todayMuseum from "@/assets/today-museum.jpg";
import todayAcoustic from "@/assets/today-acoustic.jpg";

const todayEvents = [
  {
    id: 1,
    title: "Blue Note Jazz Session",
    description: "An intimate evening of saxophone and piano improvisation at the city's oldest jazz club.",
    image: todayJazz,
  },
  {
    id: 2,
    title: "Skyline Sunset Drinks",
    description: "Enjoy handcrafted cocktails and panoramic views as the sun sets over the city.",
    image: todayRooftop,
  },
  {
    id: 3,
    title: "The Comedy Cellar",
    description: "Stand-up comedy featuring local talent and surprise guests. Laughter guaranteed.",
    image: todayComedy,
  },
  {
    id: 4,
    title: "Urban Street Food Market",
    description: "Taste flavors from around the world at the evening market stalls. Open until midnight.",
    image: todayStreetfood,
  },
  {
    id: 5,
    title: "Grand Theater: Macbeth",
    description: "A stunning modern interpretation of the classic tragedy. Last tickets available.",
    image: todayTheater,
  },
  {
    id: 6,
    title: "Underground Techno",
    description: "Deep bass and hypnotic rhythms in the industrial district. 18+ only.",
    image: todayTechno,
  },
  {
    id: 7,
    title: "Midnight at the Museum",
    description: "Exclusive late-night gallery access with guided tours of the new modern art exhibit.",
    image: todayMuseum,
  },
  {
    id: 8,
    title: "Acoustic Candlelight",
    description: "Unplugged singer-songwriter session in a cozy, candlelit atmosphere.",
    image: todayAcoustic,
  },
];

interface BentoCardProps {
  title: string;
  description: string;
  image: string;
  imagePosition: "left" | "right" | "top";
  isTall?: boolean;
  isWide?: boolean;
}

const BentoCard = ({ title, description, image, imagePosition, isTall, isWide }: BentoCardProps) => {
  // Wide card layout (for spanning 2 columns)
  if (isWide) {
    return (
      <div className="bg-card rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 h-full min-h-[280px]">
        <div className="relative h-48 md:h-full">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col h-full p-6 text-center">
          <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
            Premium Event
          </span>
          <h3 className="font-serif text-xl text-foreground mb-3">{title}</h3>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-4">
            {description}
          </p>
          <div className="mt-auto">
            <Button variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/10 font-sans text-xs px-4">
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (imagePosition === "left") {
    return (
      <div className="bg-card rounded-3xl overflow-hidden grid grid-cols-2 h-full min-h-[280px]">
        <div className="relative">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col h-full p-6 text-center">
          <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
            Premium Event
          </span>
          <h3 className="font-serif text-xl text-foreground mb-3">{title}</h3>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-4">
            {description}
          </p>
          <div className="mt-auto">
            <Button variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/10 font-sans text-xs px-4">
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (imagePosition === "right") {
    return (
      <div className="bg-card rounded-3xl overflow-hidden grid grid-cols-2 h-full min-h-[280px]">
        <div className="flex flex-col h-full p-6 text-center">
          <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
            Premium Event
          </span>
          <h3 className="font-serif text-xl text-foreground mb-3">{title}</h3>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-4">
            {description}
          </p>
          <div className="mt-auto">
            <Button variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/10 font-sans text-xs px-4">
              View Details
            </Button>
          </div>
        </div>
        <div className="relative">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  // Top image position (default for tall cards)
  return (
    <div className={`bg-card rounded-3xl overflow-hidden flex flex-col h-full ${isTall ? 'min-h-[580px]' : 'min-h-[280px]'}`}>
      <div className={`relative ${isTall ? 'flex-1' : 'h-40'}`}>
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col h-full p-6 text-center flex-shrink-0">
        <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
          Premium Event
        </span>
        <h3 className="font-serif text-xl text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-4">
          {description}
        </p>
        <div className="mt-auto">
          <Button variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/10 font-sans text-xs px-4">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

const EventsSection = () => {
  return (
    <section className="bg-background py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Left Aligned */}
        <h2 className="font-serif text-4xl md:text-5xl text-foreground text-left mb-16">
          Happening Today
        </h2>

        {/* Bento Grid - Same layout as Switzerland section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Row 1: Two horizontal cards */}
          <div className="md:col-span-2">
            <BentoCard {...todayEvents[0]} imagePosition="left" />
          </div>
          <div className="md:col-span-1 md:row-span-2">
            <BentoCard {...todayEvents[2]} imagePosition="top" isTall />
          </div>
          <div className="md:col-span-2">
            <BentoCard {...todayEvents[1]} imagePosition="right" />
          </div>

          {/* Row 2: Tall card + two stacked */}
          <div className="md:col-span-1 md:row-span-2">
            <BentoCard {...todayEvents[4]} imagePosition="top" isTall />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...todayEvents[3]} imagePosition="left" />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...todayEvents[5]} imagePosition="left" />
          </div>

          {/* Row 3: Two bottom cards */}
          <div className="md:col-span-1">
            <BentoCard {...todayEvents[6]} imagePosition="top" />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...todayEvents[7]} imagePosition="top" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
