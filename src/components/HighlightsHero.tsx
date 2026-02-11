import heroImage from "@/assets/hero-mountains.jpg";

const HighlightsHero = () => {
  return (
    <section className="relative h-72 sm:h-80 lg:h-96 overflow-hidden">
      {/* Hero Image */}
      <img
        src={heroImage}
        alt="Mountain landscape at sunset with golden bokeh lights"
        className="w-full h-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />

      {/* Glassmorphism Text Box */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="backdrop-blur-md bg-white/15 border border-white/30 rounded-2xl px-8 py-6 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-foreground text-center">
            Kuratierte Highlights für Dich
          </h1>
        </div>
      </div>
    </section>
  );
};

export default HighlightsHero;
