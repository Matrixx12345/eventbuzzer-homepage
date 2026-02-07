import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

export const ImageGallery = ({ images, alt = "Gallery image", className }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Limit to 4 images for performance
  const displayImages = images.slice(0, 4);

  if (!displayImages.length) return null;

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, displayImages.length - 1)));
  };

  const prev = () => goTo(currentIndex - 1);
  const next = () => goTo(currentIndex + 1);

  return (
    <>
      {/* Gallery Section */}
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="font-serif italic text-muted-foreground">Galerie</span>
        </h3>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-4 gap-2">
          {displayImages.map((url, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setLightboxOpen(true);
              }}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden group",
                "ring-2 ring-transparent hover:ring-primary/50 transition-all",
                i === currentIndex && "ring-primary"
              )}
            >
              <img
                src={url}
                alt={`${alt} ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Navigation */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                disabled={currentIndex === 0}
                className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                disabled={currentIndex === displayImages.length - 1}
                className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Main Image */}
          <img
            src={displayImages[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Dots Indicator */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {displayImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i); }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentIndex 
                      ? "bg-white w-6" 
                      : "bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;
