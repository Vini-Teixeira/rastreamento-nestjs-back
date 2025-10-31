import { Model, Types } from 'mongoose';
import { Entregador, EntregadorDocument } from './schemas/entregador.schema';
import { EntregadoresGateway } from './entregadores.gateway';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Delivery } from 'src/entregas/schemas/delivery.schema';
import { Socorro } from 'src/socorros/schemas/socorro.schema';
import { PontoHistoryService } from 'src/ponto-history/ponto-history.service';
import { Job } from './interfaces/job.interface';
export declare class EntregadoresService {
    private readonly deliveryModel;
    private readonly socorroModel;
    private entregadorModel;
    private entregadoresGateway;
    private readonly pontoHistoryService;
    private readonly logger;
    constructor(deliveryModel: Model<Delivery>, socorroModel: Model<Socorro>, entregadorModel: Model<EntregadorDocument>, entregadoresGateway: EntregadoresGateway, pontoHistoryService: PontoHistoryService);
    updateHeartbeat(driverId: string): Promise<void>;
    markAsActive(driverId: string): Promise<void>;
    registerLogout(driverId: string): Promise<void>;
    validatePassword(telefone: string, pass: string): Promise<EntregadorDocument | any>;
    create(createEntregadorDto: CreateEntregadorDto): Promise<Entregador>;
    update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<EntregadorDocument | null>;
    findOneByPhoneWithPassword(telefone: string): Promise<EntregadorDocument | null>;
    findOne(id: string): Promise<EntregadorDocument | null>;
    findAll(query: {
        page: number;
        limit: number;
    }): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Entregador, {}> & Entregador & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }, {}> & import("mongoose").Document<unknown, {}, Entregador, {}> & Entregador & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    delete(id: string): Promise<EntregadorDocument | null>;
    updateLocation(driverId: string, updateLocationDto: UpdateLocationDto): Promise<EntregadorDocument>;
    findMyJobs(driverId: string): Promise<Job[]>;
    updateFcmToken(driverId: string, fcmToken: string): Promise<void>;
    checkStaleHeartbeats(): Promise<void>;
}
export type DeliveryDocument = Delivery & Document;
export type SocorroDocument = Socorro & Document;
