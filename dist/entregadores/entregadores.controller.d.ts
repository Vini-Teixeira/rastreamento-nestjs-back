import { EntregadoresService } from './entregadores.service';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
export declare class EntregadoresController {
    private readonly entregadoresService;
    constructor(entregadoresService: EntregadoresService);
    buscarLocalizacaoPorTelefone(telefone: string): Promise<{
        lat: number;
        lng: number;
    }>;
    create(createEntregadorDto: CreateEntregadorDto): Promise<import("./schemas/entregador.schema").EntregadorDocument>;
    findAll(): Promise<import("./schemas/entregador.schema").EntregadorDocument[]>;
    findOne(id: string): Promise<import("./schemas/entregador.schema").EntregadorDocument | null>;
    update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<import("./schemas/entregador.schema").EntregadorDocument | null>;
    delete(id: string): Promise<import("./schemas/entregador.schema").EntregadorDocument | null>;
}
