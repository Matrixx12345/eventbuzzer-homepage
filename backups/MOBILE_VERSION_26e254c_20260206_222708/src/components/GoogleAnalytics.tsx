import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 (GA4) Configuration
// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GoogleAnalytics = () => {
  const location = useLocation();

  // Initialize Google Analytics on component mount
  useEffect(() => {
    // Skip in development if no measurement ID is set
    if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX' && import.meta.env.DEV) {
      console.log('📊 Google Analytics: Skipped (no measurement ID in development)');
      return;
    }

    // Load gtag.js script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer?.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // We'll send page views manually
    });

    return () => {
      // Cleanup: remove script on unmount
      const scripts = document.querySelectorAll(`script[src*="googletagmanager"]`);
      scripts.forEach(s => s.remove());
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });

      console.log('📊 GA4: Page view tracked:', location.pathname);
    }
  }, [location]);

  return null; // This component doesn't render anything
};

// Helper function to track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    window.gtag('event', eventName, eventParams);
    console.log('📊 GA4: Event tracked:', eventName, eventParams);
  }
};

// Specific event trackers for common actions
export const trackTicketClick = (eventId: string, eventTitle: string) => {
  trackEvent('ticket_click', {
    event_id: eventId,
    event_name: eventTitle,
  });
};

export const trackAffiliateClick = (productName: string, partner: string, price: string) => {
  trackEvent('affiliate_click', {
    product_name: productName,
    partner: partner,
    value: parseFloat(price.replace('CHF ', '').replace(',', '')),
    currency: 'CHF',
  });
};

export const trackEventFavorite = (eventId: string, eventTitle: string, action: 'add' | 'remove') => {
  trackEvent('favorite_event', {
    event_id: eventId,
    event_name: eventTitle,
    action: action,
  });
};

export const trackEventShare = (eventId: string, eventTitle: string, method: 'whatsapp' | 'email' | 'copy') => {
  trackEvent('share_event', {
    event_id: eventId,
    event_name: eventTitle,
    method: method,
  });
};

export default GoogleAnalytics;
