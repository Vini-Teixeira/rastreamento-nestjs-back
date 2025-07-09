import { Model } from 'mongoose';
import { Delivery, DeliveryDocument, DeliveryStatus, Coordinates } from './schemas/delivery.schema';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { EntregadoresService } from '../entregadores/entregadores.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';
export declare class EntregasService {
    private deliveryModel;
    private entregadoresService;
    private googleMapsService;
    private entregadoresGateway;
    private readonly logger;
    constructor(deliveryModel: Model<DeliveryDocument>, entregadoresService: EntregadoresService, googleMapsService: GoogleMapsService, entregadoresGateway: EntregadoresGateway);
    create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery>;
    findFilteredAndPaginated(statuses?: DeliveryStatus[], page?: number, limit?: number): Promise<{
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
}
