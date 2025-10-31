import { ConfigService } from '@nestjs/config';
import { Coordinates } from '../entregas/schemas/delivery.schema';
export declare class GoogleMapsService {
    private readonly configService;
    private readonly logger;
    private readonly client;
    private readonly apiKey;
    constructor(configService: ConfigService);
    private toLatLng;
    geocodeAddress(address: string): Promise<Coordinates>;
    getDirections(origin: Coordinates, destination: Coordinates): Promise<string>;
}
