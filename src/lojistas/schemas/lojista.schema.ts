import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type LojistaDocument = Lojista & Document;

@Schema({timestamps: true})
export class Lojista extends Document {
    @Prop({ required: true })
    nomeCompleto: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({required: true, select: false})
    password: string
}

export const LojistaSchema = SchemaFactory.createForClass(Lojista);

LojistaSchema.pre<LojistaDocument>('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10);
    next()
})