import { HydratedDocument, Document, Types } from 'mongoose';
export declare class Entregador {
    nome: string;
    telefone: string;
    ativo: boolean;
    password: string;
    emEntrega: boolean;
    recusasConsecutivas: number;
    lastHeartbeat: Date;
    horarioTrabalho?: string;
    lojaBaseId?: Types.ObjectId;
    localizacao?: {
        type: 'Point';
        coordinates: number[];
    };
    fcmToken?: string;
}
export type EntregadorDocument = HydratedDocument<Entregador>;
export declare const EntregadorSchema: import("mongoose").Schema<Entregador, import("mongoose").Model<Entregador, any, any, any, Document<unknown, any, Entregador, any> & Entregador & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Entregador, Document<unknown, {}, import("mongoose").FlatRecord<Entregador>, {}> & import("mongoose").FlatRecord<Entregador> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
