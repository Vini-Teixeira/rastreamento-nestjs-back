import { Document as MongooseDocument, HydratedDocument, Types } from 'mongoose';
import { Location } from 'src/entregas/schemas/delivery.schema';
export declare enum SocorroStatus {
    PENDING = "pendente",
    ACCEPTED = "aceito",
    ON_THE_WAY = "\u00E0_caminho",
    ON_SITE = "no_local",
    COMPLETED = "conclu\u00EDdo",
    CANCELLED = "cancelado"
}
export declare class Socorro extends MongooseDocument {
    codigoSocorro: string;
    solicitanteId: Types.ObjectId;
    driverId?: Types.ObjectId;
    status: SocorroStatus;
    clientLocation: Location;
    driverStartlocation?: Location;
    serviceDescription?: string;
    checkInLiberadoManualmente: boolean;
    fotos: string[];
    createdAt?: Date;
    updateAt?: Date;
}
export declare const SocorroSchema: import("mongoose").Schema<Socorro, import("mongoose").Model<Socorro, any, any, any, MongooseDocument<unknown, any, Socorro, any> & Socorro & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Socorro, MongooseDocument<unknown, {}, import("mongoose").FlatRecord<Socorro>, {}> & import("mongoose").FlatRecord<Socorro> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export type SocorroDocument = HydratedDocument<Socorro>;
