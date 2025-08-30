import { Model } from 'mongoose';
import { CreateLojaDto } from './dto/create-loja.dto';
import { Loja, LojaDocument } from './schemas/loja.schema';
export declare class LojasService {
    private lojaModel;
    constructor(lojaModel: Model<LojaDocument>);
    create(createLojaDto: CreateLojaDto): Promise<Loja>;
    findAll(): Promise<Loja[]>;
}
