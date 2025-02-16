import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Entrega extends Document {
    @Prop({ required: true })
    destinatario: string;

    @Prop({ required: true })
    endereco: string;

    @Prop({ required: true })
    lat: number;

    @Prop({ required: true })
    lng: number;

    @Prop({ required: true, default: 'pendente' })
    status: string;
}

export const EntregaSchema = SchemaFactory.createForClass(Entrega);