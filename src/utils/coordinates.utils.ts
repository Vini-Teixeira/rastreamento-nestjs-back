import { Coordinates } from '../entregas/schemas/delivery.schema';

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Converte lat/lng → GeoJSON
 */
export function toGeoJSON(lat: number, lng: number): Coordinates {
  return {
    type: 'Point',
    coordinates: [lng, lat],
  };
}


export function toLatLng(point: Coordinates): LatLng {
  return {
    lat: point.coordinates[1],
    lng: point.coordinates[0],
  };
}
