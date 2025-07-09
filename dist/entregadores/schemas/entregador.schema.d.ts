import { Document } from 'mongoose';
import { Coordinates } from '../../entregas/schemas/delivery.schema';
export type EntregadorDocument = Entregador & Document;
export declare class Entregador extends Document {
    nome: string;
    telefone: string;
    ativo: boolean;
    password: string;
    localizacao?: Coordinates;
}
export declare const EntregadorSchema: import("mongoose").Schema<Entregador, import("mongoose").Model<Entregador, any, any, any, Document<unknown, any, Entregador, any> & Entregador & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Entregador, Document<unknown, {}, import("mongoose").FlatRecord<Entregador>, {}> & import("mongoose").FlatRecord<Entregador> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
