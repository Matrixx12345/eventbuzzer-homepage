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
    <div className="flex items-center gap-1.5">
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
          flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all text-xs font-medium backdrop-blur-sm
          ${userRating === 'like' 
            ? 'bg-emerald-500 text-white shadow-lg scale-105' 
            : 'bg-white/90 hover:bg-white text-neutral-600 shadow-sm'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <ThumbsUp className={`w-3.5 h-3.5 ${userRating === 'like' ? 'fill-current' : ''}`} />
        <span>{stats.likes_count}</span>
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
          flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all text-xs font-medium backdrop-blur-sm
          ${userRating === 'dislike' 
            ? 'bg-red-500 text-white shadow-lg scale-105' 
            : 'bg-white/90 hover:bg-white text-neutral-600 shadow-sm'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <ThumbsDown className={`w-3.5 h-3.5 ${userRating === 'dislike' ? 'fill-current' : ''}`} />
        <span>{stats.dislikes_count}</span>
      </button>

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
