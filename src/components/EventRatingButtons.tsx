import { useState } from 'react';
import { ThumbsDown } from 'lucide-react';
import { useSessionId } from '@/hooks/useSessionId';
import { FeedbackModal } from './FeedbackModal';

interface EventRatingButtonsProps {
  eventId: string;
  eventTitle: string;
}

export function EventRatingButtons({ eventId, eventTitle }: EventRatingButtonsProps) {
  const sessionId = useSessionId();
  const [userRating, setUserRating] = useState<'dislike' | null>(null);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/rate-event';

  const handleDislike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId || isLoading) return;
    setShowFeedbackModal(true);
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
        setDislikesCount(data.stats?.dislikes_count || dislikesCount + 1);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setIsLoading(false);
      setShowFeedbackModal(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDislike}
        disabled={isLoading || !sessionId}
        title="Problem melden"
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full transition-all text-xs font-medium backdrop-blur-sm
          ${userRating === 'dislike' 
            ? 'bg-red-500 text-white shadow-lg scale-105' 
            : 'bg-white/90 hover:bg-white text-neutral-600 shadow-sm'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <ThumbsDown className={`w-3 h-3 ${userRating === 'dislike' ? 'fill-current' : ''}`} />
        {dislikesCount > 0 && <span>{dislikesCount}</span>}
      </button>

      {showFeedbackModal && (
        <FeedbackModal
          eventTitle={eventTitle}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
