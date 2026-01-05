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
  wellness: '#00BCD4',      // Türkis
  nature: '#4CAF50',        // Grün
  markets: '#FF5722',       // Orange/Rot
  culture: '#9C27B0',       // Violett
  food: '#FF9800',          // Orange
  sports: '#F44336',        // Rot
  family: '#2196F3',        // Blau
  elite: '#FFD700',         // Gold
  default: '#424242'        // Anthrazit
};

export const CATEGORY_FILTERS = [
  { key: 'all', label: 'Alle', color: '#424242' },
  { key: 'wellness', label: 'Wellness', color: '#00BCD4' },
  { key: 'nature', label: 'Natur', color: '#4CAF50' },
  { key: 'markets', label: 'Märkte', color: '#FF5722' },
  { key: 'culture', label: 'Kultur', color: '#9C27B0' },
  { key: 'food', label: 'Food', color: '#FF9800' },
  { key: 'sports', label: 'Sport', color: '#F44336' },
  { key: 'family', label: 'Familie', color: '#2196F3' },
  { key: 'elite', label: '⭐ Elite', color: '#FFD700' }
] as const;

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
