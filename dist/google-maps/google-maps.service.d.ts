import { ConfigService } from '@nestjs/config';
import { Coordinates as CoordinatesEntity } from 'src/entregas/schemas/delivery.schema';
interface Coordinates {
    lat: number;
    lng: number;
}
export declare class GoogleMapsService {
    private configService;
    private readonly logger;
    private googleMapsApiKey;
    private googleMapsApiUrl;
    private readonly geocodingApiUrl;
    constructor(configService: ConfigService);
    getDirections(origin: Coordinates, destination: Coordinates): Promise<string>;
    geocodeAddress(address: string): Promise<CoordinatesEntity>;
}
export {};
