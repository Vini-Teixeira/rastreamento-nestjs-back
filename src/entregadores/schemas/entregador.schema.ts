import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema()
export class Entregador extends Document {
    @Prop({ required: true})
    nome: string

    @Prop({ required: true })
    telefone: string

    @Prop({ required: true })
    ativo: boolean

    @Prop({ type: { lat: Number, lng: Number }, required: true })
    localizacao: { lat: number; lng: number };
}

export const EntregadorSchema = SchemaFactory.createForClass(Entregador)