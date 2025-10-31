import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document as MongooseDocument,
  HydratedDocument,
  Types,
} from 'mongoose';
import { Location, LocationSchema } from 'src/entregas/schemas/delivery.schema';

export enum SocorroStatus {
  PENDING = 'pendente',
  ACCEPTED = 'aceito',
  ON_THE_WAY = 'à_caminho',
  ON_SITE = 'no_local',
  COMPLETED = 'concluído',
  CANCELLED = 'cancelado',
}

@Schema({ timestamps: true })
export class Socorro extends MongooseDocument {
  @Prop({
    type: String,
    unique: true,
    sparse: true,
    index: true,
  })
  codigoSocorro: string;

  @Prop({ type: Types.ObjectId, ref: 'Lojista', required: true })
  solicitanteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Entregador', default: null })
  driverId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SocorroStatus),
    default: SocorroStatus.PENDING,
  })
  status: SocorroStatus;

  @Prop({ required: true, type: LocationSchema })
  clientLocation: Location;

  @Prop({ type: LocationSchema })
  driverStartlocation?: Location;

  @Prop({ type: String })
  serviceDescription?: string;

  @Prop({ type: Boolean, default: false })
  checkInLiberadoManualmente: boolean;

  @Prop({ type: [String], default: [] })
  fotos: string[];

  @Prop()
  createdAt?: Date;

  @Prop()
  updateAt?: Date;
}

export const SocorroSchema = SchemaFactory.createForClass(Socorro);
export type SocorroDocument = HydratedDocument<Socorro>;
