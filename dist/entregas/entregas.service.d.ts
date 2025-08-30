import { Model } from 'mongoose';
import { Delivery, DeliveryDocument, DeliveryStatus, Coordinates } from './schemas/delivery.schema';
import { EntregadorDocument } from '../entregadores/schemas/entregador.schema';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';
declare class LocationPointDto {
    deliveryId: string;
    lat: number;
    lng: number;
    timestamp: Date;
}
export declare class EntregasService {
    private deliveryModel;
    private entregadorModel;
    private googleMapsService;
    private entregadoresGateway;
    private readonly logger;
    constructor(deliveryModel: Model<DeliveryDocument>, entregadorModel: Model<EntregadorDocument>, googleMapsService: GoogleMapsService, entregadoresGateway: EntregadoresGateway);
    create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery>;
    private _findNearestDriverInfo;
    findFilteredAndPaginated(statuses: DeliveryStatus[], page?: number, limit?: number): Promise<{
        deliveries: Delivery[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Delivery>;
    update(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery>;
    delete(id: string): Promise<any>;
    findAllByDriverId(driverId: string): Promise<DeliveryDocument[]>;
    addRoutePoint(deliveryId: string, lat: number, lng: number): Promise<Delivery>;
    updateDriverLocation(deliveryId: string, lat: number, lng: number): Promise<Delivery>;
    getSnappedRoutePolyline(origin: Coordinates, destination: Coordinates): Promise<string>;
    getDriverToDestinationPolyline(driverLocation: Coordinates, destination: Coordinates): Promise<string>;
    bulkUpdateDriverLocations(driverId: string, locations: LocationPointDto[]): Promise<void>;
}
export {};
