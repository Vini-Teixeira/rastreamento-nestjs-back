// Em src/lojistas/lojistas.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { Lojista, LojistaDocument } from './schemas/lojista.schema';

@Injectable()
export class LojistasService {
  constructor(@InjectModel(Lojista.name) private lojistaModel: Model<LojistaDocument>) {}

  // ✅ Método create (antes era registerLojista)
  async create(createLojistaDto: CreateLojistaDto): Promise<Lojista> {
    const existingLojista = await this.findOneByEmail(createLojistaDto.email);
    if (existingLojista) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    const createdLojista = new this.lojistaModel(createLojistaDto);
    return createdLojista.save();
  }

  // Métodos auxiliares que o 'validate' e o 'create' precisam
  async findOneByEmail(email: string) {
    return this.lojistaModel.findOne({ email }).exec();
  }
  async findOneByEmailWithPassword(email: string) {
    return this.lojistaModel.findOne({ email }).select('+password').exec();
  }

  // ✅ Método de validação (antes era validateLojista)
  async validatePassword(email: string, pass: string): Promise<any> {
    const lojista = await this.findOneByEmailWithPassword(email);
    if (lojista && (await bcrypt.compare(pass, lojista.password))) {
      const { password, ...result } = lojista.toObject();
      return result;
    }
    return null;
  }
}