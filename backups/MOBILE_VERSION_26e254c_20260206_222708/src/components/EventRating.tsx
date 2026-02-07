import { useState, useEffect } from 'react';
import { useSessionId } from '@/hooks/useSessionId';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EventRatingProps {
  eventId: string;
  externalId?: string;
  buzzScore?: number | null;
  onRatingChange?: (newBuzzScore: number) => void;
}

/**
 * Interactive star rating for events
 * - Displays current buzz_score as stars (gold/gray)
 * - Allows users to rate (hover to animate)
 * - Quick scoring: 5⭐ = +1 buzz, 4⭐ = +0.5 buzz, etc.
 */
export function EventRating({ eventId, externalId, buzzScore, onRatingChange }: EventRatingProps) {
  const sessionId = useSessionId();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/rate-event';

  const score = buzzScore || 75; // Default to 75 if no score
  const rating = score / 20; // Convert to 0-5 scale
  const goldStars = Math.floor(rating);
  const grayStars = 5 - goldStars;

  // Check if user has already rated this event
  useEffect(() => {
    const storedRatings = localStorage.getItem('eventRatings');
    if (storedRatings) {
      const ratings = JSON.parse(storedRatings);
      const existingRating = ratings[eventId];
      if (existingRating) {
        setUserRating(existingRating);
        setHasRated(true);
      }
    }
  }, [eventId]);

  const handleRating = async (stars: number) => {
    if (!sessionId || isLoading || hasRated) return;

    setIsLoading(true);

    try {
      // Call the rate-event API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          rating_type: 'star_rating',
          session_id: sessionId,
          star_rating: stars,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserRating(stars);
        setHasRated(true);

        // Store rating in localStorage
        const storedRatings = localStorage.getItem('eventRatings');
        const ratings = storedRatings ? JSON.parse(storedRatings) : {};
        ratings[eventId] = stars;
        localStorage.setItem('eventRatings', JSON.stringify(ratings));

        // Calculate buzz score increase: 5⭐ = +1, 4⭐ = +0.5, etc.
        const buzzIncrease = (stars / 5); // 5⭐=1, 4⭐=0.8, 3⭐=0.6, 2⭐=0.4, 1⭐=0.2
        const newBuzzScore = Math.min(100, (buzzScore || 75) + buzzIncrease);
        onRatingChange?.(newBuzzScore);

        toast.success(`Danke für deine ${stars}⭐ Bewertung!`, { duration: 2000 });
      } else {
        throw new Error('Rating failed');
      }
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Bewertung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hoveredRating || (hasRated ? userRating : 0);

  return (
    <div className="group/rating relative">
      <div className="flex items-center gap-1.5">
        {/* Stars */}
        {[1, 2, 3, 4, 5].map((star) => {
          const isGold = hasRated ? star <= userRating : star <= goldStars;
          const isHovered = star <= displayRating;

          return (
            <button
              key={star}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasRated) handleRating(star);
              }}
              onMouseEnter={() => !hasRated && setHoveredRating(star)}
              onMouseLeave={() => !hasRated && setHoveredRating(0)}
              disabled={isLoading || hasRated}
              className={cn(
                "transition-all duration-200",
                hasRated ? "cursor-default" : "cursor-pointer hover:scale-125"
              )}
            >
              <span
                className={cn(
                  "text-lg transition-all duration-200",
                  isHovered && !hasRated ? "text-yellow-400 scale-110" :
                  isGold ? "text-yellow-400" : "text-gray-300"
                )}
              >
                ⭐
              </span>
            </button>
          );
        })}

        {/* Tooltip on hover - "Bewerte dieses Event" */}
        {!hasRated && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/rating:block z-50 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
              Bewerte dieses Event
            </div>
            <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1 mx-auto" />
          </div>
        )}

        {/* "Bewertet" text after rating */}
        {hasRated && (
          <span className="text-xs text-gray-500 font-medium ml-1">
            Bewertet
          </span>
        )}
      </div>
    </div>
  );
}
