import { Request } from 'express';
import { EntregasService } from './entregas.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Delivery } from './schemas/delivery.schema';
import { RejeicaoDto } from './dto/rejeicao.dto';
import { InstalandoDto } from './dto/instalando.dto';
declare class SyncLocationDto {
    locations: {
        deliveryId: string;
        lat: number;
        lng: number;
        timestamp: Date;
    }[];
}
interface AuthenticatedUser {
    sub: string;
    email?: string;
    telefone?: string;
    role: string;
}
export declare class EntregasController {
    private readonly entregasService;
    constructor(entregasService: EntregasService);
    syncLocations(syncLocationDto: SyncLocationDto, req: Request): Promise<{
        success: boolean;
    }>;
    findMyDeliveries(request: Request): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}> & import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    findDeliveryDetailsForDriver(id: string, request: Request): Promise<Delivery>;
    getDeliveryDirectionsForDriver(id: string, request: Request): Promise<{
        polyline: string;
    }>;
    recusarEntrega(deliveryId: string, request: {
        user: AuthenticatedUser;
    }, rejeicaoDto: RejeicaoDto): Promise<{
        message: string;
    }>;
    acceptDelivery(id: string, request: Request): Promise<Delivery>;
    collectItem(id: string, request: Request): Promise<Delivery>;
    liberarCheckIn(deliveryId: string, request: {
        user: AuthenticatedUser;
    }): Promise<Delivery>;
    realizarInstalacao(deliveryId: string, request: {
        user: AuthenticatedUser;
    }, instalandoDto: InstalandoDto): Promise<Delivery>;
    finishDelivery(id: string, request: Request): Promise<Delivery>;
    create(createDeliveryDto: CreateDeliveryDto, req: {
        user: AuthenticatedUser;
    }): Promise<Delivery>;
    findAll(req: {
        user: AuthenticatedUser;
    }, page?: number, limit?: number, status?: string): Promise<{
        deliveries: (import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findAllByLojista(req: {
        user: AuthenticatedUser;
    }, page?: number, limit?: number): Promise<{
        deliveries: (import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
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
