import { HydratedDocument } from 'mongoose';
export declare class Entregador {
    nome: string;
    telefone: string;
    ativo: boolean;
    password: string;
    emEntrega: boolean;
    localizacao?: {
        type: 'Point';
        coordinates: number[];
    };
}
export type EntregadorDocument = HydratedDocument<Entregador>;
export declare const EntregadorSchema: import("mongoose").Schema<Entregador, import("mongoose").Model<Entregador, any, any, any, import("mongoose").Document<unknown, any, Entregador, any> & Entregador & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Entregador, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Entregador>, {}> & import("mongoose").FlatRecord<Entregador> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
