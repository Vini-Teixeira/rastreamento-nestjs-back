import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { Lojista, LojistaDocument } from './schemas/lojista.schema';

@Injectable()
export class LojistasService {
    constructor(
        @InjectModel(Lojista.name) private lojistaModel: Model<LojistaDocument>,
    ) {}

    async create(createLojistaDto: CreateLojistaDto): Promise<Lojista> {
        const createdLojista = new this.lojistaModel(createLojistaDto);
        return createdLojista.save();
    }

    async findOneByEmail(email: string): Promise<LojistaDocument | null> {
        return this.lojistaModel.findOne({ email }).exec();
    }

    async findOneByEmailWithPassword(email: string): Promise<LojistaDocument | null> {
        return this.lojistaModel.findOne({ email }).select('+password').exec();
    }
}
