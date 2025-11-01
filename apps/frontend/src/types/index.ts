export interface Position {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationResult {
  position: Position | null;
  error: string | null;
  loading: boolean;
  method: 'gps' | 'google-api' | null;
}

export interface Route {
  id: string;
  name: string;
  distance: number;
  duration: number;
  coordinates: Position[];
  elevation?: number[];
}