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
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
