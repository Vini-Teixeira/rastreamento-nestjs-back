import { GoogleMapsService } from "src/google-maps/google-maps.service";
declare class DirectionsQueryDto {
    origin: string;
    destination: string;
}
export declare class DirectionsController {
    private readonly googleMapsService;
    constructor(googleMapsService: GoogleMapsService);
    getDirections(query: DirectionsQueryDto): Promise<{
        polyline: string;
    }>;
}
export {};
