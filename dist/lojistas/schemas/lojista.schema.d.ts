import { Document } from 'mongoose';
export type LojistaDocument = Lojista & Document;
export declare class Lojista extends Document {
    nomeCompleto: string;
    email: string;
    password: string;
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
