import { Model, Connection } from 'mongoose';
import { Delivery, DeliveryDocument, DeliveryStatus, Coordinates } from './schemas/delivery.schema';
import { EntregadorDocument } from '../entregadores/schemas/entregador.schema';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RejeicaoDto } from './dto/rejeicao.dto';
import { InstalandoDto } from './dto/instalando.dto';
import { FcmService } from 'src/fcm/fcm.service';
import { Lojista } from 'src/lojistas/schemas/lojista.schema';
type LatLng = {
    lat: number;
    lng: number;
};
interface NearestDriverResult extends EntregadorDocument {
    distanciaCalculada: number;
}
export declare class EntregasService {
    private deliveryModel;
    private entregadorModel;
    private googleMapsService;
    private entregadoresGateway;
    private readonly connection;
    private schedulerRegistry;
    private readonly fcmService;
    private readonly lojistaModel;
    private readonly logger;
    constructor(deliveryModel: Model<DeliveryDocument>, entregadorModel: Model<EntregadorDocument>, googleMapsService: GoogleMapsService, entregadoresGateway: EntregadoresGateway, connection: Connection, schedulerRegistry: SchedulerRegistry, fcmService: FcmService, lojistaModel: Model<Lojista>);
    findNearestDriverInfo(originCoordinates: Coordinates | LatLng, excludeDriverIds?: string[]): Promise<NearestDriverResult | null>;
    private _findAndReassignDelivery;
    create(createDeliveryDto: CreateDeliveryDto, solicitanteId: string): Promise<Delivery>;
    recusarEntrega(deliveryId: string, driverId: string, rejeicaoDto: RejeicaoDto): Promise<{
        message: string;
    }>;
    handleDeliveryTimeout(deliveryId: string, driverId: string): Promise<void>;
    acceptDelivery(id: string, driverId: string): Promise<Delivery>;
    collectItem(id: string, driverId: string): Promise<Delivery>;
    liberarCheckInManual(deliveryId: string, solicitanteId: string): Promise<Delivery>;
    realizarCheckIn(deliveryId: string, driverId: string, instalandoDto: InstalandoDto): Promise<Delivery>;
    finishDelivery(id: string, driverId: string): Promise<Delivery>;
    handleStaleDeliveries(): Promise<void>;
    findAll(query: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        deliveries: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }, {}> & import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAllBySolicitanteId(solicitanteId: string, page?: number, limit?: number, status?: string): Promise<{
        deliveries: (import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findFilteredAndPaginated(statuses: DeliveryStatus[], page?: number, limit?: number): Promise<{
        deliveries: Delivery[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Delivery>;
    update(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery>;
    delete(id: string): Promise<void>;
    findAllByDriverId(driverId: string, status?: DeliveryStatus[]): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}> & import("mongoose").Document<unknown, {}, Delivery, {}> & Delivery & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    addRoutePoint(deliveryId: string, lat: number, lng: number): Promise<Delivery>;
    updateDriverLocation(deliveryId: string, lat: number, lng: number): Promise<Delivery>;
    getSnappedRoutePolyline(origin: Coordinates, destination: Coordinates): Promise<string>;
    getDriverToDestinationPolyline(driverLocation: Coordinates, destination: Coordinates): Promise<string>;
    bulkUpdateDriverLocations(driverId: string, locations: Array<{
        deliveryId: string;
        lat: number;
        lng: number;
        timestamp: Date;
    }>): Promise<void>;
}
export {};
