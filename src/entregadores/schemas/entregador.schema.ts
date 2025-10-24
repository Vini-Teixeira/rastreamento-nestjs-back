import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types } from 'mongoose';
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

  @Prop({ type: Date, required: false, default: null })
  lastHeartbeat: Date;

  @Prop({ type: String, required: false })
  horarioTrabalho?: string;

  @Prop({ type: Types.ObjectId, ref: 'Lojista', required: false, default: null })
  lojaBaseId?: Types.ObjectId

  @Prop({ type: Object, required: false })
  localizacao?: {
    type: 'Point';
    coordinates: number[];
  };

  @Prop({ type: String, required: false, index: true })
  fcmToken?: string
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
