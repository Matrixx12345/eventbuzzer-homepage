import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useSessionId } from '@/hooks/useSessionId';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EventRatingProps {
  eventId: string;
  externalId?: string;
  onRatingChange?: (newRating: number) => void;
}

export function EventRating({ eventId, externalId, onRatingChange }: EventRatingProps) {
  const sessionId = useSessionId();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/rate-event';

  // Check if user has already rated this event
  useEffect(() => {
    const storedRatings = localStorage.getItem('eventRatings');
    if (storedRatings) {
      const ratings = JSON.parse(storedRatings);
      const userRating = ratings[eventId];
      if (userRating) {
        setRating(userRating);
        setHasRated(true);
      }
    }
  }, [eventId]);

  const handleRating = async (selectedRating: number) => {
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
          star_rating: selectedRating,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRating(selectedRating);
        setHasRated(true);

        // Store rating in localStorage
        const storedRatings = localStorage.getItem('eventRatings');
        const ratings = storedRatings ? JSON.parse(storedRatings) : {};
        ratings[eventId] = selectedRating;
        localStorage.setItem('eventRatings', JSON.stringify(ratings));

        // Calculate buzz score increase
        const buzzIncrease = calculateBuzzIncrease(selectedRating);
        onRatingChange?.(buzzIncrease);

        toast.success(`Danke für deine ${selectedRating}-Sterne Bewertung! ⭐`);
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

  // Calculate buzz score increase based on star rating
  const calculateBuzzIncrease = (stars: number): number => {
    switch (stars) {
      case 5: return 15;
      case 4: return 10;
      case 3: return 5;
      case 2: return 0;
      case 1: return -5;
      default: return 0;
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
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
              hasRated ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              size={20}
              className={cn(
                "transition-colors duration-200",
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>

      {hasRated && (
        <span className="text-xs text-gray-500 font-medium">
          Bewertet
        </span>
      )}
    </div>
  );
}
