import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, HydratedDocument, Types } from 'mongoose';

export enum PontoAction {
    LOGIN = 'login',
    LOGOUT = 'logout'
}

@Schema({ timestamps: true})
export class PontoHistory extends MongooseDocument {
    @Prop({ type: Types.ObjectId, ref: 'Entregador', required: true, index: true })
    driverId: Types.ObjectId;

    @Prop({ type: String, enum: Object.values(PontoAction), required: true })
    action: PontoAction;

    createdAt: Date;
}

export const PontoHistorySchema = SchemaFactory.createForClass(PontoHistory)
PontoHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export type PontoHistoryDocument = HydratedDocument<PontoHistory>