import { Request } from 'express';
import { EntregasService } from './entregas.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Delivery } from './schemas/delivery.schema';
declare class SyncLocationDto {
    locations: {
        deliveryId: string;
        lat: number;
        lng: number;
        timestamp: Date;
    }[];
}
export declare class EntregasController {
    private readonly entregasService;
    constructor(entregasService: EntregasService);
    syncLocations(syncLocationDto: SyncLocationDto, req: any): Promise<{
        message: string;
    }>;
    findMyDeliveries(request: Request): Promise<(import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
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
export {};
