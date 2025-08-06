import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({timestamps: true})
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

  @Prop({ type: Object, required: false })
  localizacao?: {
    type: 'Point',
    coordinates: number[]
  };
}

export type EntregadorDocument = HydratedDocument<Entregador>;

export const EntregadorSchema = SchemaFactory.createForClass(Entregador)
  .index({ localizacao: '2dsphere' });

EntregadorSchema.pre<EntregadorDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});