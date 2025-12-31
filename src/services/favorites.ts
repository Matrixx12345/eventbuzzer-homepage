import { getUserFingerprint } from '@/utils/fingerprint';

const EXTERNAL_SUPABASE_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';

interface ToggleFavoriteResponse {
  success: boolean;
  action: 'added' | 'removed';
  favoriteCount: number;
  isFavorited: boolean;
}

export async function toggleFavoriteApi(eventId: number): Promise<ToggleFavoriteResponse> {
  const fingerprint = getUserFingerprint();

  const response = await fetch(
    `${EXTERNAL_SUPABASE_URL}/functions/v1/toggle-favorite`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
        userFingerprint: fingerprint
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to toggle favorite');
  }

  return response.json();
}

export async function checkIsFavorited(eventId: number): Promise<boolean> {
  const fingerprint = getUserFingerprint();

  try {
    const response = await fetch(
      `${EXTERNAL_SUPABASE_URL}/functions/v1/toggle-favorite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          userFingerprint: fingerprint,
          checkOnly: true
        })
      }
    );

    if (!response.ok) return false;
    
    const data = await response.json();
    return data.isFavorited || false;
  } catch {
    return false;
  }
}
