import { GoogleMapsService } from 'src/google-maps/google-maps.service';
export declare class GeocodingController {
    private readonly googleMapsService;
    constructor(googleMapsService: GoogleMapsService);
    getCoordsFromAddress(address: string): Promise<import("../entregas/schemas/delivery.schema").Coordinates>;
}
