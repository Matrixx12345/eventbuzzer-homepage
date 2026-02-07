import { useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedEventImageProps {
  src: string;
  alt: string;
  className?: string;
  isFeatured?: boolean;
}

const OptimizedEventImage = ({ 
  src, 
  alt, 
  className = "",
  isFeatured = false 
}: OptimizedEventImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true); // Stop showing skeleton on error
  }, []);

  // Optimize image URL if it's from a known CDN
  const getOptimizedUrl = (url: string): string => {
    if (!url) return url;
    
    // For Ticketmaster images - use smaller size
    if (url.includes('ticketmaster.com') || url.includes('tmhost.co')) {
      // Request smaller image size (375x250 instead of original)
      return url.replace(/\/[0-9]+x[0-9]+/, '/375x250');
    }
    
    // For Supabase storage - could add transformations if configured
    if (url.includes('supabase.co/storage')) {
      // Add width parameter for on-the-fly resizing if supported
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=${isFeatured ? 600 : 400}`;
    }
    
    return url;
  };

  const optimizedSrc = getOptimizedUrl(src);

  return (
    <div className="relative w-full h-full">
      {/* Skeleton shown while loading */}
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full bg-listings-card-content animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        src={hasError ? src : optimizedSrc} // Fallback to original on error
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  );
};

export default OptimizedEventImage;
