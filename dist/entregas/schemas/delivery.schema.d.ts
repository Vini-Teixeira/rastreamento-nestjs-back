import { HydratedDocument, Types } from 'mongoose';
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
export declare const CoordinatesSchema: import("mongoose").Schema<Coordinates, import("mongoose").Model<Coordinates, any, any, any, import("mongoose").Document<unknown, any, Coordinates, any> & Coordinates & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Coordinates, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Coordinates>, {}> & import("mongoose").FlatRecord<Coordinates> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Location {
    address: string;
    coordinates: Coordinates;
}
export declare const LocationSchema: import("mongoose").Schema<Location, import("mongoose").Model<Location, any, any, any, import("mongoose").Document<unknown, any, Location, any> & Location & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Location, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Location>, {}> & import("mongoose").FlatRecord<Location> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Delivery {
    origin: Location;
    destination: Location;
    itemDescription: string;
    status: DeliveryStatus;
    driverId?: Types.ObjectId;
    routeHistory?: Coordinates[];
    driverCurrentLocation?: Coordinates;
}
export type DeliveryDocument = HydratedDocument<Delivery>;
export declare const DeliverySchema: import("mongoose").Schema<Delivery, import("mongoose").Model<Delivery, any, any, any, import("mongoose").Document<unknown, any, Delivery, any> & Delivery & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Delivery, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Delivery>, {}> & import("mongoose").FlatRecord<Delivery> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
