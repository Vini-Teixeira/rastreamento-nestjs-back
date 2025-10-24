import { Document as MongooseDocument, HydratedDocument, Types } from 'mongoose';
export declare enum PontoAction {
    LOGIN = "login",
    LOGOUT = "logout"
}
export declare class PontoHistory extends MongooseDocument {
    driverId: Types.ObjectId;
    action: PontoAction;
    createdAt: Date;
}
export declare const PontoHistorySchema: import("mongoose").Schema<PontoHistory, import("mongoose").Model<PontoHistory, any, any, any, MongooseDocument<unknown, any, PontoHistory, any> & PontoHistory & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PontoHistory, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<PontoHistory>, {}> & import("mongoose").FlatRecord<PontoHistory> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export type PontoHistoryDocument = HydratedDocument<PontoHistory>;
