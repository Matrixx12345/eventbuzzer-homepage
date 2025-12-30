import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useSessionId } from '@/hooks/useSessionId';
import { FeedbackModal } from './FeedbackModal';

interface EventRatingButtonsProps {
  eventId: string;
  eventTitle: string;
}

export function EventRatingButtons({ eventId, eventTitle }: EventRatingButtonsProps) {
  const sessionId = useSessionId();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const API_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/rate-event';

  const handleReport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId || isLoading || hasReported) return;
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
        setHasReported(true);
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
        onClick={handleReport}
        disabled={isLoading || !sessionId || hasReported}
        className={`
          inline-flex items-center gap-1.5 text-xs transition-colors
          ${hasReported 
            ? 'text-neutral-400 cursor-default' 
            : 'text-neutral-400 hover:text-neutral-600'
          }
          disabled:cursor-not-allowed
        `}
      >
        <Flag className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span>{hasReported ? 'Gemeldet' : 'Fehler melden'}</span>
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
