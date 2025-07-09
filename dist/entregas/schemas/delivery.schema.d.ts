import { Document, Types } from 'mongoose';
export type DeliveryDocument = Delivery & Document;
export declare enum DeliveryStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    ON_THE_WAY = "on_the_way",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Coordinates {
    lat: number;
    lng: number;
    timestamp?: Date;
}
export declare const CoordinatesSchema: import("mongoose").Schema<Coordinates, import("mongoose").Model<Coordinates, any, any, any, Document<unknown, any, Coordinates, any> & Coordinates & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Coordinates, Document<unknown, {}, import("mongoose").FlatRecord<Coordinates>, {}> & import("mongoose").FlatRecord<Coordinates> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Location {
    address: string;
    coordinates: Coordinates;
}
export declare const LocationSchema: import("mongoose").Schema<Location, import("mongoose").Model<Location, any, any, any, Document<unknown, any, Location, any> & Location & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Location, Document<unknown, {}, import("mongoose").FlatRecord<Location>, {}> & import("mongoose").FlatRecord<Location> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Delivery extends Document {
    origin: Location;
    destination: Location;
    itemDescription: string;
    status: DeliveryStatus;
    driverId?: Types.ObjectId;
    routeHistory?: Coordinates[];
    driverCurrentLocation?: Coordinates;
}
export declare const DeliverySchema: import("mongoose").Schema<Delivery, import("mongoose").Model<Delivery, any, any, any, Document<unknown, any, Delivery, any> & Delivery & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Delivery, Document<unknown, {}, import("mongoose").FlatRecord<Delivery>, {}> & import("mongoose").FlatRecord<Delivery> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
