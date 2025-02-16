import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entregador } from './schemas/entregador.schema';
import axios from 'axios';

@Injectable()
export class EntregadoresService {
    private readonly googleMapsApiKey = 'SUA_API_KEY';

    constructor(
        @InjectModel(Entregador.name) private entregadorModel: Model<Entregador>,
    ) {}

    async create(data: any): Promise<Entregador> {
        return new this.entregadorModel(data).save();
    }

    async findAll(): Promise<Entregador[]> {
        return this.entregadorModel.find().exec();
    }

    async findOne(id: string): Promise<Entregador | null> {
        return this.entregadorModel.findById(id).exec();
    }

    async update(id: string, data: any): Promise<Entregador | null> {
        return this.entregadorModel
            .findByIdAndUpdate(id, data, { new: true })
            .exec();
    }

    async delete(id: string): Promise<Entregador | null> {
        return this.entregadorModel.findByIdAndDelete(id).exec();
    }

    async encontrarEntregadorMaisProximo(
        latDestino: number,
        lngDestino: number,
        entregadores: any[],
    ) {
        let entregadorMaisProximo = null;
        let menorDistancia = Infinity;

        for (const entregador of entregadores) {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${entregador.lat},${entregador.lng}&destinations=${latDestino},${lngDestino}&mode=driving&key=${this.googleMapsApiKey}`;

            const resposta = await axios.get(url);
            const distancia = resposta.data.rows[0].elements[0].distance.value;

            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                entregadorMaisProximo = entregador;
            }
        }

        return entregadorMaisProximo;
    }

    async atualizarLocalizacao(id: Types.ObjectId, lat: number, lng: number) {

        try {
            const entregador = await this.entregadorModel.findById(id);
            if (!entregador) {
                throw new NotFoundException('Entregador não encontrado');
            }
    
            return this.entregadorModel.findByIdAndUpdate(id, { lat, lng }, { new: true });
        } catch (error) {
            // ...
        }

        try {
            return this.entregadorModel.findByIdAndUpdate(
                id,
                { lat, lng },
                { new: true },
            );
        } catch (error) {
            console.error('Erro ao atualizar no banco de dados:', error);
            throw error;
        }
    }
}