import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entregador, EntregadorDocument } from './schemas/entregador.schema';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import * as bcrypt from 'bcrypt';

const logger = new Logger('EntregadoresService');

@Injectable()
export class EntregadoresService {
  constructor(
    @InjectModel(Entregador.name) private entregadorModel: Model<EntregadorDocument>,
  ) {}

  async validatePassword(telefone: string, pass: string): Promise<EntregadorDocument | any> {
    const driver = await this.entregadorModel.findOne({ telefone }).select('+password').exec();
    if (driver && await bcrypt.compare(pass, driver.password)) {
      const { password, ...result } = driver.toObject();
      return result;
    }
    return null;
  }

  async create(createEntregadorDto: CreateEntregadorDto): Promise<EntregadorDocument> {
    const newEntregador = new this.entregadorModel(createEntregadorDto);
    return newEntregador.save();
  }

  async findOneByPhoneWithPassword(telefone: string): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findOne({ telefone }).select('+password').exec();
  }

  async findAll(): Promise<EntregadorDocument[]> {
    return this.entregadorModel.find().exec();
  }

  async findOne(id: string): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findById(id).exec();
  }

  async update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findByIdAndUpdate(id, updateEntregadorDto, { new: true }).exec();
  }

  async delete(id: string): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findByIdAndDelete(id).exec();
  }

  async updateLocation(driverId: string, updateLocationDto: UpdateLocationDto): Promise<EntregadorDocument> {
    const { lat, lng } = updateLocationDto;

    logger.log(`updateLocation -> driverId: ${driverId} | lat:${lat} lng:${lng}`);

    const geoJsonPoint = {
      type: 'Point' as const,
      coordinates: [lng, lat],
    };

    const updatedDriver = await this.entregadorModel.findByIdAndUpdate(
      driverId,
      { $set: { localizacao: geoJsonPoint } },
      { new: true },
    ).exec();

    if (!updatedDriver) {
      logger.warn(`Entregador não encontrado (id: ${driverId}) ao tentar atualizar localização.`);
      throw new NotFoundException(`Entregador com ID ${driverId} não encontrado.`);
    }

    logger.log(`updateLocation -> sucesso para entregador ${driverId}`);
    return updatedDriver;
  }
}
