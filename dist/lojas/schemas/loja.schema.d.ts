import { Document } from 'mongoose';
export type LojaDocument = Loja & Document;
export declare class Loja extends Document {
    nome: string;
    endereco: string;
    coordenadas: {
        type: 'Point';
        coordinates: number[];
    };
}
export declare const LojaSchema: import("mongoose").Schema<Loja, import("mongoose").Model<Loja, any, any, any, Document<unknown, any, Loja, any> & Loja & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Loja, Document<unknown, {}, import("mongoose").FlatRecord<Loja>, {}> & import("mongoose").FlatRecord<Loja> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
