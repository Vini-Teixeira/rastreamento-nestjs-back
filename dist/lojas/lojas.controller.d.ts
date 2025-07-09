import { LojasService } from './lojas.service';
import { CreateLojaDto } from './dto/create-loja.dto';
export declare class LojasController {
    private readonly lojasService;
    constructor(lojasService: LojasService);
    create(createLojaDto: CreateLojaDto): Promise<import("./schemas/loja.schema").Loja>;
    findAll(): Promise<import("./schemas/loja.schema").Loja[]>;
}
