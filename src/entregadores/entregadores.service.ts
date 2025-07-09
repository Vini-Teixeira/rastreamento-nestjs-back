import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entregador, EntregadorDocument } from './schemas/entregador.schema';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';

@Injectable()
export class EntregadoresService {
  private readonly googleMapsApiKey: string;
  private readonly distanceMatrixApiUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  constructor(
    @InjectModel(Entregador.name) private entregadorModel: Model<EntregadorDocument>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('Maps_API_KEY');
    if (!apiKey) {
      throw new Error('Maps_API_KEY não configurada para EntregadoresService.');
    }
    this.googleMapsApiKey = apiKey;
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
    return this.entregadorModel.findById(id as string).exec(); 
  }

  async update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findByIdAndUpdate(id, updateEntregadorDto, { new: true }).exec();
  }

  async delete(id: string): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findByIdAndDelete(id as string).exec(); 
  }

  async encontrarEntregadorMaisProximo(latDestino: number, lngDestino: number, entregadores: EntregadorDocument[]): Promise<EntregadorDocument | null> { // <--- CORREÇÃO: Retorno EntregadorDocument | null
    let entregadorMaisProximo: EntregadorDocument | null = null;
    let menorDistancia = Infinity;

    for (const entregador of entregadores) {
      if (!entregador.localizacao || entregador.localizacao.lat == null || entregador.localizacao.lng == null) {
        console.warn(`Entregador ${entregador.nome} (${entregador._id}) não tem localização válida. Pulando.`);
        continue;
      }

      const url = `${this.distanceMatrixApiUrl}?origins=${entregador.localizacao.lat},${entregador.localizacao.lng}&destinations=${latDestino},${lngDestino}&mode=driving&key=${this.googleMapsApiKey}`;

      try {
        const resposta = await axios.get(url);
        if (resposta.data.status === 'OK' &&
            resposta.data.rows &&
            resposta.data.rows[0] &&
            resposta.data.rows[0].elements &&
            resposta.data.rows[0].elements[0] &&
            resposta.data.rows[0].elements[0].distance) {

            const distancia = resposta.data.rows[0].elements[0].distance.value;

            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                entregadorMaisProximo = entregador;
            }
        } else {
            console.error('Resposta inválida da Distance Matrix API:', resposta.data);
        }
      } catch (error: any) {
        console.error('Erro ao chamar Distance Matrix API para entregador:', entregador.nome, error.message);
      }
    }

    return entregadorMaisProximo;
  }

  async atualizarLocalizacao(id: Types.ObjectId, lat: number, lng: number): Promise<EntregadorDocument> { 
    try {
      const updatedEntregador = await this.entregadorModel.findByIdAndUpdate(
        id.toString(),
        { localizacao: { lat, lng } },
        { new: true }
      ).exec(); 

      if (!updatedEntregador) {
        throw new NotFoundException('Entregador não encontrado para atualização de localização.');
      }
      return updatedEntregador;
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      throw error; 
    }
  }

  async buscarLocalizacaoPorTelefone(telefone: string): Promise<{ lat: number; lng: number } | null> {
    const entregador = await this.entregadorModel.findOne({ telefone }).exec();
    if (!entregador) {
      return null;
    }
    if (!entregador.localizacao || entregador.localizacao.lat == null || entregador.localizacao.lng == null) {
      console.warn(`Localização do entregador ${entregador.nome} (${entregador._id}) não é válida.`);
      return null;
    }
    return {
      lat: entregador.localizacao.lat,
      lng: entregador.localizacao.lng,
    };
  }
}