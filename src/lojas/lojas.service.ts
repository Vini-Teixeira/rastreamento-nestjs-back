import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLojaDto } from './dto/create-loja.dto';
import { Loja, LojaDocument } from './schemas/loja.schema';

@Injectable()
export class LojasService {
  constructor(
    @InjectModel(Loja.name) private lojaModel: Model<LojaDocument>,
  ) {}

  async create(createLojaDto: CreateLojaDto): Promise<Loja> {
    const { nome, endereco, coordenadas } = createLojaDto;

    const geoJsonPoint = {
      type: 'Point' as const, 
      coordinates: [coordenadas.lng, coordenadas.lat], 
    };

    const createdLoja = new this.lojaModel({
      nome,
      endereco,
      coordenadas: geoJsonPoint,
    });
    
    return createdLoja.save();
  }

  async findAll(): Promise<Loja[]> {
    return this.lojaModel.find().exec();
  }
}