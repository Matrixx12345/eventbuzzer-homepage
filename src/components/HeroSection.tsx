import heroImage from "@/assets/hero-mountains.jpg";
import HeroFilterBar from "./HeroFilterBar";

interface HeroSectionProps {
  onFilterChange?: (categoryValue: string | null) => void;
}

const HeroSection = ({ onFilterChange }: HeroSectionProps) => {
  return (
    <section className="relative">
      {/* Hero Headline above image */}
      <div className="bg-navbar py-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-foreground">
          Find Events Like Never Before
        </h1>
      </div>

      {/* Hero Image with Filter Bar */}
      <div className="relative h-72 sm:h-96 lg:h-[28rem] overflow-hidden">
        <img
          src={heroImage}
          alt="Mountain landscape at sunset with golden bokeh lights"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
        
        {/* Filter Bar positioned at bottom of hero */}
        <HeroFilterBar onFilterChange={onFilterChange} />
      </div>
    </section>
  );
};

export default HeroSection;
