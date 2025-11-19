import { Model } from 'mongoose';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { UpdateLojistaDto } from './dto/update-lojista.dto';
import { Lojista, LojistaDocument } from './schemas/lojista.schema';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { Delivery } from 'src/entregas/schemas/delivery.schema';
import { Socorro } from 'src/socorros/schemas/socorro.schema';
export declare class LojistasService {
    private lojistaModel;
    private deliveryModel;
    private socorroModel;
    private readonly googleMapsService;
    constructor(lojistaModel: Model<LojistaDocument>, deliveryModel: Model<Delivery>, socorroModel: Model<Socorro>, googleMapsService: GoogleMapsService);
    getDashboardSummary(solicitanteId: string): Promise<{
        concluidas: any;
        emAndamento: any;
        canceladas: any;
    }>;
    findById(id: string): Promise<Lojista | null>;
    create(createLojistaDto: CreateLojistaDto): Promise<Lojista>;
    update(id: string, updateLojistaDto: UpdateLojistaDto): Promise<Lojista | null>;
    delete(id: string): Promise<Lojista | null>;
    findAll(query: {
        page: number;
        limit: number;
    }): Promise<{
        data: (import("mongoose").Document<unknown, {}, LojistaDocument, {}> & Lojista & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOneByEmail(email: string): Promise<(import("mongoose").Document<unknown, {}, LojistaDocument, {}> & Lojista & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    findOneByEmailWithPassword(email: string): Promise<(import("mongoose").Document<unknown, {}, LojistaDocument, {}> & Lojista & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    validatePassword(email: string, pass: string): Promise<any>;
    findAllForSelection(): Promise<Lojista[]>;
}
