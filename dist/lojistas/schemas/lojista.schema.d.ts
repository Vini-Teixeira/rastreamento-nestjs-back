import { Document } from 'mongoose';
export declare class Coordinates {
    type: string;
    coordinates: number[];
}
export type LojistaDocument = Lojista & Document;
export declare class Lojista extends Document {
    nomeFantasia: string;
    cnpj: string;
    email: string;
    endereco: string;
    password: string;
    coordinates: Coordinates;
}
export declare const LojistaSchema: import("mongoose").Schema<Lojista, import("mongoose").Model<Lojista, any, any, any, Document<unknown, any, Lojista, any> & Lojista & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Lojista, Document<unknown, {}, import("mongoose").FlatRecord<Lojista>, {}> & import("mongoose").FlatRecord<Lojista> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
