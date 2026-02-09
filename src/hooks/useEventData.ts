import { useState, useCallback, useEffect } from 'react';
import { externalSupabase } from '@/integrations/supabase/externalClient';

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
  buzz_boost?: number | string;
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

  // SOFORT Top-Events laden (parallel zur Map)
  // 2 parallele Queries: must-see (Elite) + Top buzz_score Events
  useEffect(() => {
    const loadInitialEvents = async () => {
      try {
        const [eliteResult, topResult] = await Promise.all([
          // 1. Must-See / Elite Events
          externalSupabase
            .from('events_without_markets')
            .select('*')
            .contains('tags', ['must-see'])
            .order('buzz_score', { ascending: false, nullsLast: true })
            .limit(20),
          // 2. Top Events nach buzz_score
          externalSupabase
            .from('events_without_markets')
            .select('*')
            .order('buzz_score', { ascending: false, nullsLast: true })
            .limit(80),
        ]);

        if (eliteResult.error) console.error('Elite events load error:', eliteResult.error);
        if (topResult.error) console.error('Top events load error:', topResult.error);

        const eliteEvents = eliteResult.data || [];
        const topEvents = topResult.data || [];

        // Merge: Elite zuerst, dann Top (ohne Duplikate)
        const eliteIds = new Set(eliteEvents.map(e => e.id));
        const merged = [...eliteEvents, ...topEvents.filter(e => !eliteIds.has(e.id))];

        if (merged.length > 0) {
          setRawEvents(prev => {
            if (prev.length === 0) {
              console.log(`⚡ Fast-loaded ${merged.length} initial events (${eliteEvents.length} elite + ${merged.length - eliteEvents.length} top)`);
              setLoading(false);
              return merged;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Initial events fetch failed:', err);
      }
    };

    loadInitialEvents();
  }, []);

  const handleMapEventsChange = useCallback((newEvents: Event[]) => {
    console.log('📋 handleMapEventsChange called with', newEvents.length, 'events');
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
