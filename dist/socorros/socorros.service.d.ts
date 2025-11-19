import { Model, Connection } from 'mongoose';
import { Socorro } from './schemas/socorro.schema';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { EntregasService } from 'src/entregas/entregas.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';
import { CreateSocorroDto } from './dto/create-socorro.dto';
import { Entregador } from 'src/entregadores/schemas/entregador.schema';
import { ChegueiAoLocalDto } from './dto/cheguei-ao-local.dto';
import { FinalizarSocorroDto } from './dto/finalizar-socorro.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { FcmService } from 'src/fcm/fcm.service';
import { LojistasService } from 'src/lojistas/lojistas.service';
import { RejeicaoDto } from 'src/entregas/dto/rejeicao.dto';
export declare class SocorrosService {
    private readonly socorroModel;
    private readonly entregadorModel;
    private readonly connection;
    private readonly googleMapsService;
    private readonly entregasService;
    private readonly lojistasService;
    private readonly entregadoresGateway;
    private schedulerRegistry;
    private readonly fcmService;
    private readonly logger;
    constructor(socorroModel: Model<Socorro>, entregadorModel: Model<Entregador>, connection: Connection, googleMapsService: GoogleMapsService, entregasService: EntregasService, lojistasService: LojistasService, entregadoresGateway: EntregadoresGateway, schedulerRegistry: SchedulerRegistry, fcmService: FcmService);
    recusarSocorro(socorroId: string, driverId: string, rejeicaoDto: RejeicaoDto): Promise<{
        message: string;
    }>;
    handleSocorroTimeout(socorroId: string, driverId: string): Promise<void>;
    private _findAndReassignSocorro;
    findAllBySolicitanteId(solicitanteId: string, page: number, limit: number, status?: string): Promise<{
        data: Socorro[];
        total: number;
        page: number;
        limit: number;
    }>;
    findAllByDriverId(driverId: string): Promise<Socorro[]>;
    create(createSocorroDto: CreateSocorroDto, lojistaId: string): Promise<import("mongoose").Document<unknown, {}, Socorro, {}> & Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, Socorro, {}> & Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    acceptSocorro(socorroId: string, driverId: string): Promise<import("mongoose").Document<unknown, {}, Socorro, {}> & Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    iniciarDeslocamento(socorroId: string, driverId: string): Promise<import("mongoose").Document<unknown, {}, Socorro, {}> & Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    chegueiAoLocal(socorroId: string, driverId: string, chegueiAoLocalDto: ChegueiAoLocalDto): Promise<import("mongoose").Document<unknown, {}, Socorro, {}> & Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    liberarCheckInManual(socorroId: string, lojistaId: string): Promise<Socorro>;
    finalizarSocorro(socorroId: string, driverId: string, finalizarSocorroDto: FinalizarSocorroDto): Promise<import("mongoose").Document<unknown, {}, Socorro, {}> & Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    private gerarCodigoAleatorio;
}
