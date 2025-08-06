import { Model } from 'mongoose';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { Lojista, LojistaDocument } from './schemas/lojista.schema';
export declare class LojistasService {
    private lojistaModel;
    constructor(lojistaModel: Model<LojistaDocument>);
    create(createLojistaDto: CreateLojistaDto): Promise<Lojista>;
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
}
