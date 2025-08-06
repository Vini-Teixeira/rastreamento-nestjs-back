import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LojaDocument = Loja & Document;

@Schema({timestamps: true})
export class Loja extends Document {
    @Prop({ required: true, unique: true })
    nome: string;

    @Prop({ required: true })
    endereco: string;

    @Prop({
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      }
    })
    coordenadas: {
      type: 'Point',
      coordinates: number[]
    };
}

export const LojaSchema = SchemaFactory.createForClass(Loja)
  .index({ coordenadas: '2dsphere' });