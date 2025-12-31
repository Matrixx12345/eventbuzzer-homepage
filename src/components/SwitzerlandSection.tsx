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
const swissEvents = [{
  id: 1,
  title: "The Geneva Watch & Art Fair",
  description: "Experience the world's finest timepieces and contemporary art at Lake Geneva.",
  image: swissGeneva,
  imagePosition: "left",
  slug: "geneva-watch-fair",
  location: "Genf (GE)",
  latitude: 46.2044,
  longitude: 6.1432
}, {
  id: 2,
  title: "Lucerne Classical Summer",
  description: "Immerse yourself in world-class orchestral performances in Lucerne.",
  image: swissLucerne,
  imagePosition: "right",
  slug: "lucerne-classical",
  location: "Luzern (LU)",
  latitude: 47.0502,
  longitude: 8.3093
}, {
  id: 3,
  title: "Bern Federal Plaza Market",
  description: "Discover artisanal treasures and local delicacies at the historic Federal Plaza.",
  image: swissBern,
  imagePosition: "top",
  isTall: true,
  slug: "bern-market",
  location: "Bern (BE)",
  latitude: 46.948,
  longitude: 7.4474
}, {
  id: 4,
  title: "Zermatt Matterhorn Hiking Week",
  description: "Embark on guided alpine adventures with panoramic views of the Matterhorn.",
  image: swissZermatt,
  imagePosition: "left",
  slug: "zermatt-hiking",
  location: "Zermatt (VS)",
  latitude: 46.0207,
  longitude: 7.7491
}, {
  id: 5,
  title: "St. Moritz Winter Polo",
  description: "Experience the ultimate alpine adventure on the frozen lake of St. Moritz.",
  image: swissZermatt,
  imagePosition: "left",
  slug: "st-moritz-polo",
  location: "St. Moritz (GR)",
  latitude: 46.4908,
  longitude: 9.8355
}, {
  id: 6,
  title: "Zurich Film Festival Specials",
  description: "Celebrate international cinema in Zurich's charming Old Town.",
  image: swissZurich,
  imagePosition: "top",
  slug: "zurich-film",
  location: "Zürich (ZH)",
  latitude: 47.3769,
  longitude: 8.5417
}, {
  id: 7,
  title: "Interlaken Adventure Days",
  description: "Soar above the Swiss Alps with paragliding in Europe's adventure capital.",
  image: swissInterlaken,
  imagePosition: "top",
  slug: "interlaken-adventure",
  location: "Interlaken (BE)",
  latitude: 46.6863,
  longitude: 7.8632
}, {
  id: 8,
  title: "Basel Autumn Fair",
  description: "Experience Switzerland's largest fair along the Rhine River.",
  image: swissBasel,
  imagePosition: "top",
  slug: "basel-fair",
  location: "Basel (BS)",
  latitude: 47.5596,
  longitude: 7.5886
}, {
  id: 9,
  title: "The Grand Train Tour Winter Edition",
  description: "Unforgettable journey aboard the Glacier Express through Alpine landscapes.",
  image: swissTrain,
  imagePosition: "left",
  isWide: true,
  slug: "grand-train-tour",
  location: "Chur (GR)",
  latitude: 46.8508,
  longitude: 9.532
}];
interface BentoCardProps {
  title: string;
  description: string;
  image: string;
  imagePosition: string;
  isTall?: boolean;
  isWide?: boolean;
  slug?: string;
  location: string;
  latitude: number;
  longitude: number;
}
const BentoCard = ({
  title,
  description,
  image,
  imagePosition,
  isTall,
  isWide,
  slug,
  location,
  latitude,
  longitude
}: BentoCardProps) => {
  const CardContent = <div className="flex flex-col justify-center p-6 text-center h-full">
      <span className="text-primary text-[10px] font-sans tracking-[0.2em] uppercase mb-2">Premium Highlight</span>
      {/* Titel fixiert auf 2 Zeilen */}
      <h3 className="font-serif text-lg text-white mb-2 line-clamp-2 min-h-[3rem]">{title}</h3>

      {/* Location mit Mini-Map Hover */}
      <div className="group/map relative inline-flex items-center justify-center gap-1 text-gray-400 text-xs mb-3 cursor-help">
        <span className="text-red-500">📍</span>
        <span className="border-b border-dotted border-gray-600 hover:text-white transition-colors">{location}</span>

        {/* MINI-MAP TOOLTIP */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
          <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-36 h-24 overflow-hidden flex items-center justify-center">
            <div className="relative w-full h-full">
              <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
              <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm" style={{
              left: `${(longitude - 5.9) / (10.5 - 5.9) * 100}%`,
              top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`
            }} />
            </div>
          </div>
          <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 mx-auto shadow-sm" />
        </div>
      </div>

      <p className="text-gray-400 font-sans text-xs leading-relaxed mb-4 line-clamp-2">{description}</p>
      <div className="mt-auto">
        <span className="inline-block border border-white/20 text-white hover:bg-white/10 text-[10px] px-3 py-1.5 rounded transition-colors uppercase tracking-wider">
          Explore
        </span>
      </div>
    </div>;
  const cardBaseClass = "bg-neutral-900 rounded-3xl overflow-hidden h-full group transition-all duration-300 hover:ring-1 hover:ring-white/20 shadow-xl";
  if (isWide) {
    return <Link to={`/event/${slug}`} className="block h-full">
        <div className={`${cardBaseClass} grid grid-cols-1 md:grid-cols-2 min-h-[280px]`}>
          <div className="relative h-48 md:h-full overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          {CardContent}
        </div>
      </Link>;
  }
  if (imagePosition === "left" || imagePosition === "right") {
    return <Link to={`/event/${slug}`} className="block h-full">
        <div className={`${cardBaseClass} grid grid-cols-2 min-h-[280px]`}>
          {imagePosition === "left" && <div className="relative overflow-hidden">
              <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>}
          {CardContent}
          {imagePosition === "right" && <div className="relative overflow-hidden">
              <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>}
        </div>
      </Link>;
  }
  return <Link to={`/event/${slug}`} className="block h-full">
      <div className={`${cardBaseClass} flex flex-col ${isTall ? "min-h-[580px]" : "min-h-[280px]"}`}>
        <div className={`relative overflow-hidden ${isTall ? "flex-1" : "h-40"}`}>
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-shrink-0">{CardContent}</div>
      </div>
    </Link>;
};
const SwitzerlandSection = () => {
  return <section className="bg-background py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl mb-16 not-italic text-left md:text-4xl text-neutral-500">
          Highlights diesen Monat in der Schweiz:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <BentoCard {...swissEvents[0]} />
          </div>
          <div className="md:col-span-1 md:row-span-2">
            <BentoCard {...swissEvents[2]} isTall />
          </div>
          <div className="md:col-span-2">
            <BentoCard {...swissEvents[1]} />
          </div>

          <div className="md:col-span-1">
            <BentoCard {...swissEvents[3]} />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[4]} />
          </div>

          <div className="md:col-span-1">
            <BentoCard {...swissEvents[5]} />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[6]} />
          </div>
          <div className="md:col-span-1">
            <BentoCard {...swissEvents[7]} />
          </div>

          <div className="md:col-span-2">
            <BentoCard {...swissEvents[8]} />
          </div>
        </div>
      </div>
    </section>;
};
export default SwitzerlandSection;