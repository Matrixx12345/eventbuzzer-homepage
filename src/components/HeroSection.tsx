import HeroFilterBar from "./HeroFilterBar";

const HeroSection = () => {
  return (
    <section className="bg-background">
      {/* Hero Headline - flat, minimal */}
      <div className="pt-8 pb-4 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-foreground">
          Find Events Like Never Before
        </h1>
      </div>

      {/* Sticky Filter Bar Container */}
      <HeroFilterBar />
    </section>
  );
};

export default HeroSection;
