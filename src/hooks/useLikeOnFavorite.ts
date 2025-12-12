import { useSessionId } from './useSessionId';

const API_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/rate-event';

export function useLikeOnFavorite() {
  const sessionId = useSessionId();

  const sendLike = async (eventId: string) => {
    if (!sessionId) return;
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          rating_type: 'like',
          session_id: sessionId,
        }),
      });
    } catch (error) {
      console.error('Like rating error:', error);
    }
  };

  return { sendLike };
}
