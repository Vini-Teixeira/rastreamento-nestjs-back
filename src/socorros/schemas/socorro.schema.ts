import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document as MongooseDocument,
  HydratedDocument,
  Types,
} from 'mongoose';
import { timestamp } from 'rxjs';
import { Location, LocationSchema } from 'src/entregas/schemas/delivery.schema';

export enum SocorroStatus {
  PENDING = 'pendente',
  ACCEPTED = 'aceito',
  ON_THE_WAY = 'a_caminho',
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

  @Prop({
  type: [
    {
      motivo: { type: String, required: true },
      texto: { type: String },
      driverId: { type: Types.ObjectId, ref: 'Entregador' },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  default: [],
})
historicoRejeicoes: {
  motivo: string;
  texto?: string;
  driverId: Types.ObjectId;
  timestamp: Date;
}[];


  @Prop({ required: true, type: LocationSchema })
  clientLocation: Location;

  @Prop({ type: LocationSchema })
  driverStartlocation?: Location;

  @Prop({ required: true, trim: true })
  clienteNome: string;

  @Prop({ required: true, trim: true })
  solicitanteNome: string;

  @Prop({ required: true, trim: true })
  clienteTelefone: string;

  @Prop({ required: false, trim: true })
  placaVeiculo?: string;

  @Prop({ required: false, trim: true })
  modeloVeiculo?: string;

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
