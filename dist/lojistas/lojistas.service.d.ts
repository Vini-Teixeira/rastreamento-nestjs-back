import { Model } from 'mongoose';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { Lojista, LojistaDocument } from './schemas/lojista.schema';
export declare class LojistasService {
    private lojistaModel;
    constructor(lojistaModel: Model<LojistaDocument>);
    create(createLojistaDto: CreateLojistaDto): Promise<Lojista>;
    findOneByEmail(email: string): Promise<LojistaDocument | null>;
    findOneByEmailWithPassword(email: string): Promise<LojistaDocument | null>;
}
