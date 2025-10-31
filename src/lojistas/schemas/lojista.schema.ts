import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({ _id: false })
export class Coordinates {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number] })
  coordinates: number[];
}

export type LojistaDocument = Lojista & Document;

@Schema({ timestamps: true, collection: 'lojistas' })
export class Lojista extends Document {
  @Prop({ required: true })
  nomeFantasia: string;

  @Prop({ required: true, unique: true })
  cnpj: string; 

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  endereco: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: Coordinates })
  coordinates: Coordinates;
}

export const LojistaSchema = SchemaFactory.createForClass(Lojista);

LojistaSchema.pre<LojistaDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
