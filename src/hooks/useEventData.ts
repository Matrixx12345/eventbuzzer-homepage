import { useState, useCallback } from 'react';

export interface Event {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  short_description?: string;
  location?: string;
  venue_name?: string;
  address_city?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  price_from?: number;
  price_to?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  source?: string;
  relevance_score?: number;
  buzz_score?: number;
  favorite_count?: number;
  category_main_id?: number;
  category_sub_id?: number;
  gallery_urls?: string[];
  url?: string;
  ticket_url?: string;
}

export const useEventData = () => {
  const [rawEvents, setRawEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const handleMapEventsChange = useCallback((newEvents: Event[]) => {
    setRawEvents(newEvents);
    setLoading(false);
  }, []);

  return {
    rawEvents,
    setRawEvents,
    loading,
    hoveredEventId,
    setHoveredEventId,
    handleMapEventsChange,
  };
};
