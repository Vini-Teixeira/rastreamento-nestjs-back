import { Coordinates } from '../entregas/schemas/delivery.schema';
export interface LatLng {
    lat: number;
    lng: number;
}
export declare function toGeoJSON(lat: number, lng: number): Coordinates;
export declare function toLatLng(point: Coordinates): LatLng;
