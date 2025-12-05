import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import swissGeneva from "@/assets/swiss-geneva.jpg";
import swissLucerne from "@/assets/swiss-lucerne.jpg";
import swissBern from "@/assets/swiss-bern.jpg";
import swissZermatt from "@/assets/swiss-zermatt.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import swissInterlaken from "@/assets/swiss-interlaken.jpg";
import swissBasel from "@/assets/swiss-basel.jpg";
import swissTrain from "@/assets/swiss-train.jpg";

const swissEvents = [
  {
    id: 1,
    title: "The Geneva Watch & Art Fair",
    description: "Experience the world's finest timepieces and contemporary art at Lake Geneva's most prestigious annual event.",
    image: swissGeneva,
    gridClass: "col-span-1 row-span-1",
    imagePosition: "left",
    slug: "geneva-watch-fair",
  },
  {
    id: 2,
    title: "Lucerne Classical Summer",
    description: "Immerse yourself in world-class orchestral performances set against the stunning backdrop of Chapel Bridge.",
    image: swissLucerne,
    gridClass: "col-span-1 row-span-1",
    imagePosition: "right",
    slug: "lucerne-classical",
  },
  {
    id: 3,
    title: "Bern Federal Plaza Market",
    description: "Discover artisanal treasures and local delicacies at the historic Federal Plaza.",
    image: swissBern,
    gridClass: "md:col-span-1 md:row-span-2",
    imagePosition: "top",
    isTall: true,
    slug: "bern-market",
  },
  {
    id: 4,
    title: "Zermatt Matterhorn Hiking Week",
    description: "Embark on guided alpine adventures with panoramic views of the iconic Matterhorn peak.",
    image: swissZermatt,
    gridClass: "col-span-1 row-span-1",
    imagePosition: "left",
    slug: "zermatt-hiking",
  },
  {
    id: 5,
    title: "Zermatt Matterhorn Hiking Week",
    description: "Experience the ultimate alpine adventure through breathtaking Swiss mountain trails.",
    image: swissZermatt,
    gridClass: "col-span-1 row-span-1",
    imagePosition: "left",
    slug: "zermatt-hiking",
  },
  {
    id: 6,
    title: "Zurich Film Festival Specials",
    description: "Celebrate international cinema in Zurich's charming Old Town with exclusive screenings.",
    image: swissZurich,
    gridClass: "col-span-1 row-span-1",
    imagePosition: "top",
    slug: "zurich-film",
  },
  {
    id: 7,
    title: "Interlaken Adventure Days",
    description: "Soar above the Swiss Alps with paragliding and outdoor activities in Europe's adventure capital.",
    image: swissInterlaken,
    gridClass: "col-span-1 row-span-1",
    imagePosition: "top",
    slug: "interlaken-adventure",
  },
  {
    id: 8,
    title: "Basel Autumn Fair",
    description: "Experience Switzerland's largest fair along the Rhine River with traditional crafts and festivities.",
    image: swissBasel,
    gridClass: "col-span-1 row-span-1",
    imagePosition: "top",
    slug: "basel-fair",
  },
  {
    id: 9,
    title: "The Grand Train Tour Winter Edition",
    description: "Embark on an unforgettable journey aboard the iconic Glacier Express through snow-covered Alpine landscapes.",
    image: swissTrain,
    gridClass: "md:col-span-2 row-span-1",
    imagePosition: "left",
    isWide: true,
    slug: "grand-train-tour",
  },
];

interface BentoCardProps {
  title: string;
  description: string;
  image: string;
  imagePosition: string;
  isTall?: boolean;
  isWide?: boolean;
  slug?: string;
}

const BentoCard = ({ title, description, image, imagePosition, isTall, isWide, slug = "geneva-watch-fair" }: BentoCardProps) => {
  // Wide card layout (for spanning 2 columns)
  if (isWide) {
    return (
      <Link to={`/event/${slug}`} className="block h-full group">
        <div className="bg-card rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 h-full min-h-[280px]">
          <div className="relative h-48 md:h-full overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="flex flex-col justify-center p-6 text-center">
            <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
              Premium Event
            </span>
            <h3 className="font-serif text-xl text-white mb-3">{title}</h3>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-4">
              {description}
            </p>
            <div>
              <span className="inline-block border border-card-foreground/30 text-card-foreground hover:bg-card-foreground/10 font-sans text-xs px-4 py-2 rounded-md transition-colors">
                View Details
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (imagePosition === "left") {
    return (
      <Link to={`/event/${slug}`} className="block h-full group">
        <div className="bg-card rounded-3xl overflow-hidden grid grid-cols-2 h-full min-h-[280px]">
          <div className="relative overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="flex flex-col justify-center p-6 text-center">
            <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
              Premium Event
            </span>
            <h3 className="font-serif text-xl text-white mb-3">{title}</h3>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-4">
              {description}
            </p>
            <div>
              <span className="inline-block border border-card-foreground/30 text-card-foreground hover:bg-card-foreground/10 font-sans text-xs px-4 py-2 rounded-md transition-colors">
                View Details
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (imagePosition === "right") {
    return (
      <Link to={`/event/${slug}`} className="block h-full group">
        <div className="bg-card rounded-3xl overflow-hidden grid grid-cols-2 h-full min-h-[280px]">
          <div className="flex flex-col justify-center p-6 text-center">
            <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
              Premium Event
            </span>
            <h3 className="font-serif text-xl text-white mb-3">{title}</h3>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-4">
              {description}
            </p>
            <div>
              <span className="inline-block border border-card-foreground/30 text-card-foreground hover:bg-card-foreground/10 font-sans text-xs px-4 py-2 rounded-md transition-colors">
                View Details
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </Link>
    );
  }

  // Top image position (default for tall and bottom row cards)
  return (
    <Link to={`/event/${slug}`} className="block h-full group">
      <div className={`bg-card rounded-3xl overflow-hidden flex flex-col h-full ${isTall ? 'min-h-[580px]' : 'min-h-[280px]'}`}>
        <div className={`relative overflow-hidden ${isTall ? 'flex-1' : 'h-40'}`}>
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex flex-col justify-center p-6 text-center flex-shrink-0">
          <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-3">
            Premium Event
          </span>
          <h3 className="font-serif text-xl text-white mb-3">{title}</h3>
          <p className="text-gray-400 font-sans text-sm leading-relaxed mb-4">
            {description}
          </p>
          <div>
            <span className="inline-block border border-card-foreground/30 text-card-foreground hover:bg-card-foreground/10 font-sans text-xs px-4 py-2 rounded-md transition-colors">
              View Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const SwitzerlandSection = () => {
  return (
    <section className="bg-background py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h2 className="font-serif text-4xl md:text-5xl text-foreground text-center mb-16">
          This Month in Switzerland
        </h2>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Row 1: Two horizontal cards */}
          <div className="md:col-span-2">
            <BentoCard {...swissEvents[0]} />
          </div>
          <div className="md:col-span-1 md:row-span-2">
            <BentoCard {...swissEvents[2]} />
          </div>
          <div className="md:col-span-2">
            <BentoCard {...swissEvents[1]} />
          </div>

          {/* Row 2: Tall card + two stacked */}
          <div className="md:col-span-1 md:row-span-2">
            <BentoCard {...swissEvents[2]} image={swissBern} title="Bern Federal Plaza Market" description="Discover artisanal treasures and local delicacies at the historic Federal Plaza." imagePosition="top" isTall />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[3]} />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[4]} />
          </div>

          {/* Row 3: Three bottom cards */}
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[5]} />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[6]} />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[7]} />
          </div>

          {/* Row 4: Wide feature card */}
          <div className="md:col-span-2">
            <BentoCard {...swissEvents[8]} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SwitzerlandSection;
