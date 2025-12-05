import heroImage from "@/assets/hero-mountains.jpg";

const HeroSection = () => {
  return (
    <section className="relative">
      {/* Hero Headline above image */}
      <div className="bg-navbar py-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-foreground">
          Find Events Like Never Before
        </h1>
      </div>

      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <img
          src={heroImage}
          alt="Mountain landscape at sunset with golden bokeh lights"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
      </div>

      {/* Centered Subtitle */}
      <div className="bg-background py-8 text-center">
        <p className="text-lg md:text-xl font-sans text-muted-foreground tracking-wide">
          Discover what's buzzing:
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
