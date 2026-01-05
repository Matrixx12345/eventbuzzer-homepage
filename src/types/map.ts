export interface MapEvent {
  id: string;
  external_id?: string;
  title: string;
  venue_name?: string;
  address_city?: string;
  image_url?: string;
  start_date?: string;
  latitude: number;
  longitude: number;
  mapbox_lng?: number;
  mapbox_lat?: number;
  buzz_score?: number;
  price_from?: number;
  price_to?: number;
  category_main_id?: number;
  tags?: string[];
  buzz_boost?: number;
}

export type CategoryType = 
  | 'wellness' 
  | 'nature' 
  | 'markets' 
  | 'culture' 
  | 'food' 
  | 'sports' 
  | 'family' 
  | 'elite' 
  | 'default';

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  wellness: '#4DD0E1',      // Sanftes Türkis
  nature: '#66BB6A',        // Weiches Grün
  markets: '#FF7043',       // Warmes Orange
  culture: '#AB47BC',       // Sanftes Violett
  food: '#FFA726',          // Helles Orange
  sports: '#EF5350',        // Weiches Rot
  family: '#42A5F5',        // Helles Blau
  elite: '#FFD700',         // Gold (Elite!)
  default: '#616161'        // Helles Anthrazit
};

export const CATEGORY_FILTERS = [
  { key: 'all', label: 'Alle', color: '#616161' },
  { key: 'wellness', label: 'Wellness', color: '#4DD0E1' },
  { key: 'nature', label: 'Natur', color: '#66BB6A' },
  { key: 'markets', label: 'Märkte', color: '#FF7043' },
  { key: 'culture', label: 'Kultur', color: '#AB47BC' },
  { key: 'food', label: 'Food', color: '#FFA726' },
  { key: 'family', label: 'Familie', color: '#42A5F5' },
  { key: 'elite', label: '⭐ Elite', color: '#FFD700' }
] as const;

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
