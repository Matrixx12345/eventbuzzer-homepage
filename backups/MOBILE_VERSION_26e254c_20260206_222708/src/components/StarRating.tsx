import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface StarRatingProps {
  eventId: string;
  buzzScore?: number | null;
  relevanceScore?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

// Helper to get/set user ratings from localStorage
const getUserRating = (eventId: string): number | null => {
  const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
  return ratings[eventId] || null;
};

const setUserRatingStorage = (eventId: string, rating: number) => {
  const ratings = JSON.parse(localStorage.getItem('eventRatings') || '{}');
  ratings[eventId] = rating;
  localStorage.setItem('eventRatings', JSON.stringify(ratings));
};

export function StarRating({
  eventId,
  buzzScore,
  relevanceScore,
  size = 'md',
  showScore = true
}: StarRatingProps) {
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  // Load user's existing rating
  useEffect(() => {
    setUserRating(getUserRating(eventId));
  }, [eventId]);

  // Calculate display score with user rating boost
  const baseScore = (buzzScore || relevanceScore || 75) / 20;
  const ratingBoost = userRating ? (userRating - 3) * 0.1 : 0;
  const displayScore = Math.min(5, Math.max(0, baseScore + ratingBoost)).toFixed(1);

  // Handle rating submission
  const handleRating = (rating: number) => {
    setUserRatingStorage(eventId, rating);
    setUserRating(rating);
    setShowRatingPopup(false);
    toast.success(`Danke für deine Bewertung! ⭐ ${rating}/5`, { duration: 2000 });
  };

  // Size classes
  const sizeClasses = {
    sm: { container: 'w-8 h-8', star: 14, text: 'text-xs', popoverStar: 18 },
    md: { container: 'w-11 h-11', star: 20, text: 'text-sm', popoverStar: 24 },
    lg: { container: 'w-14 h-14', star: 24, text: 'text-base', popoverStar: 28 },
  };

  const s = sizeClasses[size];

  return (
    <Popover open={showRatingPopup} onOpenChange={setShowRatingPopup}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 group"
          title="Event bewerten"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-center ${s.container} rounded-full border border-gray-300 shadow-md group-hover:border-yellow-400 group-hover:bg-yellow-50 transition-all`}>
            <Star
              size={s.star}
              className={userRating ? "fill-yellow-400 text-yellow-400" : "text-yellow-500"}
            />
          </div>
          {showScore && (
            <span className={`${s.text} font-semibold text-gray-700`}>
              {displayScore}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="center" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
          {userRating ? 'Deine Bewertung ändern:' : 'Event bewerten:'}
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => {
                e.stopPropagation();
                handleRating(star);
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                size={s.popoverStar}
                className={
                  (hoverRating || userRating || 0) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
        {userRating && (
          <p className="text-[10px] text-gray-400 text-center mt-1">
            Du hast {userRating}/5 gegeben
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
