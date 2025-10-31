import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({ timestamps: true, collection: 'entregadores' })
export class Entregador {
  @Prop({ required: true })
  nome: string;

  @Prop({ required: true, unique: true })
  telefone: string;

  @Prop({ required: true })
  ativo: boolean;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: false })
  emEntrega: boolean;

  @Prop({ type: Number, required: true, default: 0 })
  recusasConsecutivas: number;

  @Prop({ type: Date, default: null })
  lastHeartbeat?: Date;

  @Prop({ type: String })
  horarioTrabalho?: string;

  @Prop({ type: Types.ObjectId, ref: 'Lojista', default: null })
  lojaBaseId?: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  localizacao?: {
    type: 'Point';
    coordinates: number[];
  };

  @Prop({ type: String, index: true })
  fcmToken?: string;
}

export type EntregadorDocument = HydratedDocument<Entregador>;

export const EntregadorSchema = SchemaFactory.createForClass(Entregador).index({
  localizacao: '2dsphere',
});

EntregadorSchema.pre<EntregadorDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
