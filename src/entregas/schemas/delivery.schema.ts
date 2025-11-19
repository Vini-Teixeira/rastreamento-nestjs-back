import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  HydratedDocument,
  Types,
  Document as MongooseDocument,
} from 'mongoose';
import { RejeicaoDto } from '../dto/rejeicao.dto';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { EModoPagamento } from '../enums/pagamento.enum';

@Schema({ _id: false })
export class Coordinates {
  @Prop({ required: true, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({
    required: true,
    type: [Number],
    validate: {
      validator: (value: number[]) =>
        Array.isArray(value) &&
        value.length === 2 &&
        value.every((num) => typeof num === 'number'),
      message: 'Coordinates must be an array of [lng, lat]',
    },
  })
  coordinates: number[];

  @Prop()
  timestamp?: Date;
}
export const CoordinatesSchema = SchemaFactory.createForClass(Coordinates);

@Schema({ _id: false })
export class Location {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true, type: CoordinatesSchema })
  coordinates: Coordinates;

  @Prop()
  name?: string;
}
export const LocationSchema = SchemaFactory.createForClass(Location);

// Início código de Schemas para Rejeições
@Schema({ _id: false })
class RejeicaoInfo {
  @Prop()
  motivo: string;

  @Prop()
  texto?: string;

  @Prop({ type: Types.ObjectId, ref: 'Entregador' })
  driverId: Types.ObjectId;

  @Prop()
  timestamp: Date;
}

export const RejeicaoInfoSchema = SchemaFactory.createForClass(RejeicaoInfo);
// Fim código de Schemas para Rejeições

@Schema({ timestamps: true })
export class Delivery extends MongooseDocument {
  @Prop({ required: true })
  clienteNome: string;

  @Prop({ required: true })
  clienteTelefone: string;

  @Prop({ required: true, enum: Object.values(EModoPagamento) })
  modalidadePagamento: string;

  @Prop({ type: String, required: false, default: '' })
  observacoes: string;

  @Prop({ required: true, type: LocationSchema })
  origin: Location;

  @Prop({ required: true, type: LocationSchema })
  destination: Location;

  @Prop({ required: true })
  itemDescription: string;

  @Prop({
    type: String,
    enum: Object.values(DeliveryStatus),
    default: DeliveryStatus.PENDENTE,
  })
  status: DeliveryStatus;

  @Prop({ type: Types.ObjectId, ref: 'Lojista', required: true })
  solicitanteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lojista', required: true })
  origemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Entregador', default: null })
  driverId?: Types.ObjectId;

  @Prop({ type: [CoordinatesSchema] })
  routeHistory?: Coordinates[];

  @Prop({ type: CoordinatesSchema })
  driverCurrentLocation?: Coordinates;

  @Prop({
    type: String,
    required: false,
    unique: true,
    sparse: true,
    index: true,
  })
  codigoEntrega: string;

  @Prop({ type: Boolean, default: false })
  checkInLiberadoManualmente: boolean;

  @Prop({ type: [RejeicaoDto], default: [] })
  historicoRejeicoes: RejeicaoInfo[];

  @Prop({ type: [Types.ObjectId], ref: 'Entregador', default: [] })
  rejectedBy: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  rejectionCount: number;

  @Prop({ type: Boolean, default: false })
  recolherSucata: boolean;

  @Prop()
  tipoEntrega?: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updateAt?: Date;
}

export type DeliveryDocument = HydratedDocument<Delivery>;
export const DeliverySchema = SchemaFactory.createForClass(Delivery);
