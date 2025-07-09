import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Coordinates,
  CoordinatesSchema,
} from '../../entregas/schemas/delivery.schema';

export type EntregadorDocument = Entregador & Document;

@Schema()
export class Entregador extends Document {
  @Prop({ required: true })
  nome: string;

  @Prop({ required: true, unique: true })
  telefone: string;

  @Prop({ required: true })
  ativo: boolean;

  @Prop({ required: true, select: false }) 
  password: string;

  @Prop({ type: CoordinatesSchema, required: false })
  localizacao?: Coordinates;
}

export const EntregadorSchema = SchemaFactory.createForClass(Entregador);

EntregadorSchema.pre<EntregadorDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);

  next();
});
