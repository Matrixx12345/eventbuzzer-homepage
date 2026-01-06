import { ReactNode, useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

interface EventCarouselProps {
  children: ReactNode;
  title: string;
  linkPath?: string;
  linkLabel?: string;
  showEndCard?: boolean;
}

const EventCarousel = ({ 
  children, 
  title, 
  linkPath, 
  linkLabel = "Alle anzeigen",
  showEndCard = true 
}: EventCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-8 md:py-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Title with reduced size and increased letter-spacing */}
        <h2 className="text-2xl md:text-2xl font-serif text-foreground/80 mb-6 tracking-wide">
          {title}
        </h2>

        {/* Carousel Container */}
        <div className="relative">
          {/* Previous Button - Glassmorphism, IMMER sichtbar */}
          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/90 transition-colors -ml-4"
              aria-label="Vorherige"
            >
              <ChevronLeft size={28} strokeWidth={2.5} className="text-stone-700" />
            </button>
          )}

          {/* Next Button - Glassmorphism, IMMER sichtbar */}
          {canScrollNext && (
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/90 transition-colors -mr-4"
              aria-label="Nächste"
            >
              <ChevronRight size={28} strokeWidth={2.5} className="text-stone-700" />
            </button>
          )}

          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {children}
              
              {/* End Card - "Alle anzeigen" */}
              {showEndCard && linkPath && (
                <div className="flex-shrink-0 w-[300px] md:w-[320px]">
                  <Link 
                    to={linkPath}
                    className="flex items-center justify-center h-[320px] bg-white/50 backdrop-blur-sm rounded-2xl border border-stone-200/50 hover:bg-white/70 hover:border-stone-300 transition-all duration-300 group"
                  >
                    <div className="text-center px-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                        <ArrowRight size={28} className="text-stone-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-lg font-medium text-stone-700 group-hover:text-stone-900">
                        {linkLabel}
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventCarousel;
