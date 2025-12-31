import { getUserFingerprint } from "@/utils/fingerprint";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event-buzz`;

/**
 * Track a click on an event card (silent, fire-and-forget)
 */
export async function trackEventClick(eventId: string | number): Promise<void> {
  try {
    const fingerprint = getUserFingerprint();
    
    await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        trackingType: "click",
        userFingerprint: fingerprint,
      }),
    });
  } catch (error) {
    // Silent fail - don't block user experience
    console.debug("Click tracking failed:", error);
  }
}

/**
 * Track a referral visit to an event (when coming from external source)
 */
export async function trackEventReferral(eventId: string | number): Promise<void> {
  try {
    const fingerprint = getUserFingerprint();
    
    await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        trackingType: "referral",
        userFingerprint: fingerprint,
      }),
    });
  } catch (error) {
    // Silent fail - don't block user experience
    console.debug("Referral tracking failed:", error);
  }
}

/**
 * Check if the current visit is from an external referrer
 */
export function isExternalReferral(): boolean {
  const referrer = document.referrer;
  
  // No referrer = direct link (could be from social media apps that strip referrer)
  if (!referrer) return false;
  
  try {
    const referrerUrl = new URL(referrer);
    const currentHost = window.location.hostname;
    
    // If referrer is from a different domain, it's external
    if (referrerUrl.hostname !== currentHost) {
      return true;
    }
  } catch {
    // Invalid referrer URL
  }
  
  // Check for UTM parameters (explicit tracking)
  const params = new URLSearchParams(window.location.search);
  if (params.has("utm_source") || params.has("ref") || params.has("from")) {
    return true;
  }
  
  return false;
}
