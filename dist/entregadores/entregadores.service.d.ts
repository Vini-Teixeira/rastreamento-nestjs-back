import { Model, Types } from 'mongoose';
import { EntregadorDocument } from './schemas/entregador.schema';
import { ConfigService } from '@nestjs/config';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
export declare class EntregadoresService {
    private entregadorModel;
    private configService;
    private readonly googleMapsApiKey;
    private readonly distanceMatrixApiUrl;
    constructor(entregadorModel: Model<EntregadorDocument>, configService: ConfigService);
    create(createEntregadorDto: CreateEntregadorDto): Promise<EntregadorDocument>;
    findOneByPhoneWithPassword(telefone: string): Promise<EntregadorDocument | null>;
    findAll(): Promise<EntregadorDocument[]>;
    findOne(id: string): Promise<EntregadorDocument | null>;
    update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<EntregadorDocument | null>;
    delete(id: string): Promise<EntregadorDocument | null>;
    encontrarEntregadorMaisProximo(latDestino: number, lngDestino: number, entregadores: EntregadorDocument[]): Promise<EntregadorDocument | null>;
    atualizarLocalizacao(id: Types.ObjectId, lat: number, lng: number): Promise<EntregadorDocument>;
    buscarLocalizacaoPorTelefone(telefone: string): Promise<{
        lat: number;
        lng: number;
    } | null>;
}
