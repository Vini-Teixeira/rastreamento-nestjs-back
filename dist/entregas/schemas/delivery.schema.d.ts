import { HydratedDocument, Types, Document as MongooseDocument } from 'mongoose';
import { DeliveryStatus } from '../enums/delivery-status.enum';
export declare class Coordinates {
    type: string;
    coordinates: number[];
    timestamp?: Date;
}
export declare const CoordinatesSchema: import("mongoose").Schema<Coordinates, import("mongoose").Model<Coordinates, any, any, any, MongooseDocument<unknown, any, Coordinates, any> & Coordinates & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Coordinates, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<Coordinates>, {}> & import("mongoose").FlatRecord<Coordinates> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Location {
    address: string;
    coordinates: Coordinates;
}
export declare const LocationSchema: import("mongoose").Schema<Location, import("mongoose").Model<Location, any, any, any, MongooseDocument<unknown, any, Location, any> & Location & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Location, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<Location>, {}> & import("mongoose").FlatRecord<Location> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
declare class RejeicaoInfo {
    motivo: string;
    texto?: string;
    driverId: Types.ObjectId;
    timestamp: Date;
}
export declare const RejeicaoInfoSchema: import("mongoose").Schema<RejeicaoInfo, import("mongoose").Model<RejeicaoInfo, any, any, any, MongooseDocument<unknown, any, RejeicaoInfo, any> & RejeicaoInfo & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RejeicaoInfo, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<RejeicaoInfo>, {}> & import("mongoose").FlatRecord<RejeicaoInfo> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Delivery extends MongooseDocument {
    origin: Location;
    destination: Location;
    itemDescription: string;
    status: DeliveryStatus;
    solicitanteId: Types.ObjectId;
    origemId: Types.ObjectId;
    driverId?: Types.ObjectId;
    routeHistory?: Coordinates[];
    driverCurrentLocation?: Coordinates;
    codigoEntrega: string;
    checkInLiberadoManualmente: boolean;
    historicoRejeicoes: RejeicaoInfo[];
    recolherSucata: boolean;
    createdAt?: Date;
    updateAt?: Date;
}
export type DeliveryDocument = HydratedDocument<Delivery>;
export declare const DeliverySchema: import("mongoose").Schema<Delivery, import("mongoose").Model<Delivery, any, any, any, MongooseDocument<unknown, any, Delivery, any> & Delivery & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Delivery, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<Delivery>, {}> & import("mongoose").FlatRecord<Delivery> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export {};
