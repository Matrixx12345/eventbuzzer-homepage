// Generate and persist a unique user fingerprint for anonymous favorite tracking
export function getUserFingerprint(): string {
  const key = 'eventbuzzer_user_fingerprint';
  
  // Check localStorage for existing fingerprint
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  // Generate new fingerprint
  const fingerprint = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem(key, fingerprint);
  return fingerprint;
}
