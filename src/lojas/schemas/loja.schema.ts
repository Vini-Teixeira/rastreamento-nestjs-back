import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Coordinates, CoordinatesSchema } from 'src/entregas/schemas/delivery.schema';

export type LojaDocument = Loja & Document;

@Schema({timestamps: true})
export class Loja extends Document {
    @Prop({ required: true, unique: true })
    nome: string;

    @Prop({ required: true })
    endereco: string;

    @Prop({ required: true, type: CoordinatesSchema })
    coordenadas: Coordinates;
}

export const LojaSchema = SchemaFactory.createForClass(Loja);