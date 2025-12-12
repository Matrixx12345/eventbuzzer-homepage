import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSessionId } from '@/hooks/useSessionId';
import { FeedbackModal } from './FeedbackModal';

interface EventRatingButtonsProps {
  eventId: string;
  eventTitle: string;
  initialStats?: {
    likes_count: number;
    dislikes_count: number;
    total_ratings: number;
  };
}

export function EventRatingButtons({ eventId, eventTitle, initialStats }: EventRatingButtonsProps) {
  const sessionId = useSessionId();
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [stats, setStats] = useState(initialStats || { likes_count: 0, dislikes_count: 0, total_ratings: 0 });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/rate-event';

  const handleRating = async (ratingType: 'like' | 'dislike') => {
    if (!sessionId || isLoading) return;

    if (ratingType === 'dislike') {
      setShowFeedbackModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          rating_type: ratingType,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUserRating(ratingType);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Rating error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (category: string) => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          rating_type: 'dislike',
          session_id: sessionId,
          feedback_category: category,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUserRating('dislike');
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setIsLoading(false);
      setShowFeedbackModal(false);
    }
  };

  const likePercentage = stats.total_ratings > 0 
    ? Math.round((stats.likes_count / stats.total_ratings) * 100) 
    : null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Thumbs Up Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRating('like');
        }}
        disabled={isLoading || !sessionId}
        title="Gefällt mir"
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm
          ${userRating === 'like' 
            ? 'bg-emerald-100 text-emerald-700 shadow-md scale-105' 
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <ThumbsUp className={`w-4 h-4 ${userRating === 'like' ? 'fill-emerald-500 text-emerald-600' : ''}`} />
        <span className="font-medium">{stats.likes_count}</span>
      </button>

      {/* Thumbs Down Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRating('dislike');
        }}
        disabled={isLoading || !sessionId}
        title="Gefällt mir nicht"
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm
          ${userRating === 'dislike' 
            ? 'bg-destructive text-destructive-foreground shadow-md scale-105' 
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <ThumbsDown className={`w-4 h-4 ${userRating === 'dislike' ? 'fill-current' : ''}`} />
        <span className="font-medium">{stats.dislikes_count}</span>
      </button>

      {/* Percentage display */}
      {likePercentage !== null && stats.total_ratings >= 5 && (
        <span className="text-xs text-muted-foreground ml-1">
          {likePercentage}% gefällt das
        </span>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          eventTitle={eventTitle}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
