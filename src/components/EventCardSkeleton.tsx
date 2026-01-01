import { Skeleton } from "@/components/ui/skeleton";

interface EventCardSkeletonProps {
  isFeatured?: boolean;
}

const EventCardSkeleton = ({ isFeatured = false }: EventCardSkeletonProps) => {
  return (
    <article 
      className={`group bg-listings-card rounded-xl overflow-hidden shadow-lg flex flex-col ${
        isFeatured ? 'lg:row-span-2 h-full' : 'h-full'
      }`}
    >
      {/* Image Section Skeleton */}
      <div className={`relative overflow-hidden ${isFeatured ? 'flex-grow' : 'aspect-[2.5/1]'}`}>
        <Skeleton className="w-full h-full bg-listings-card-content" />
        
        {/* Date Badge Skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-16 rounded-lg bg-white/30" />
        </div>
        
        {/* Favorite Button Skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-8 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="p-4 flex-shrink-0 bg-listings-card-content rounded-b-xl">
        {/* Location Skeleton */}
        <Skeleton className="h-3 w-24 mb-2 bg-listings-text/10" />
        
        {/* Title Skeleton */}
        <Skeleton className="h-5 w-full mb-1 bg-listings-text/10" />
        
        {/* Description Skeleton */}
        <Skeleton className="h-3 w-3/4 mt-2 bg-listings-text/10" />
        
        {/* Footer Skeleton */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-listings-text/10">
          <Skeleton className="h-3 w-12 bg-listings-text/10" />
          <Skeleton className="h-3 w-16 bg-listings-text/10" />
          <Skeleton className="h-4 w-6 ml-auto bg-listings-text/10" />
        </div>
      </div>
    </article>
  );
};

export default EventCardSkeleton;
