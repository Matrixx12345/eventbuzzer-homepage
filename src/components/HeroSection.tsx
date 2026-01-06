import heroImage from "@/assets/hero-mountains.jpg";
import HeroFilterBar from "./HeroFilterBar";
import ScrollIndicator from "./ScrollIndicator";

const HeroSection = () => {
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
        <HeroFilterBar />
      </div>

      {/* Scroll Indicator - milky pill with animated chevron */}
      <div className="bg-[#F5F0E8] pt-8 pb-4 flex justify-center">
        <ScrollIndicator />
      </div>
    </section>
  );
};

export default HeroSection;
