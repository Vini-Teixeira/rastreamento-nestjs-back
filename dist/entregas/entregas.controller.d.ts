import { Request } from 'express';
import { EntregasService } from './entregas.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Delivery } from './schemas/delivery.schema';
export declare class EntregasController {
    private readonly entregasService;
    constructor(entregasService: EntregasService);
    findMyDeliveries(request: Request): Promise<import("./schemas/delivery.schema").DeliveryDocument[]>;
    findDeliveryDetailsForDriver(id: string, request: Request): Promise<Delivery>;
    getDeliveryDirectionsForDriver(id: string, request: Request): Promise<{
        polyline: string;
    }>;
    acceptDelivery(id: string, request: Request): Promise<Delivery>;
    collectItem(id: string, request: Request): Promise<Delivery>;
    finishDelivery(id: string, request: Request): Promise<Delivery>;
    create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery>;
    findAll(statusStrings: string[], page?: number, limit?: number): Promise<{
        deliveries: Delivery[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Delivery>;
    update(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery>;
    addRoutePoint(id: string, lat: number, lng: number): Promise<Delivery>;
    delete(id: string): Promise<void>;
    updateDriverLocation(id: string, lat: number, lng: number): Promise<Delivery>;
    getDeliveryDirections(id: string): Promise<{
        polyline: string;
    }>;
}
