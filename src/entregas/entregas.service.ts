import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entrega } from './schemas/entregas.schema';
import { CriarEntregaDto } from './dto/criar-entrega.dto';
import { EntregadoresService } from '../entregadores/entregadores.service';

@Injectable()
export class EntregasService {
    constructor(
        @InjectModel(Entrega.name) private entregaModel: Model<Entrega>,
        private entregadoresService: EntregadoresService
    ) {}

    async criarEntrega(entregaDto: CriarEntregaDto): Promise<Entrega> {
        const entregadores = await this.entregadoresService.findAll();
        const entregador = entregadores[0];

        if (!entregador) {
            throw new NotFoundException('Nenhum entregador disponível');
        }

        const novaEntrega = new this.entregaModel({
            ...entregaDto,
            entregadorId: entregador._id,
            status: 'pendente',
        });

        return novaEntrega.save();
    }

    async listarEntregas(): Promise<Entrega[]> {
        return this.entregaModel.find().populate('entregador').exec();
    }

    async atualizarStatusEntrega(id: string, status: string) {
        return this.entregaModel.findByIdAndUpdate(id, { status }, { new: true })
    }
}