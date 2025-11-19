import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { UpdateLojistaDto } from './dto/update-lojista.dto';
import { Lojista, LojistaDocument } from './schemas/lojista.schema';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { Delivery } from 'src/entregas/schemas/delivery.schema';
import { Socorro } from 'src/socorros/schemas/socorro.schema';
import { DeliveryStatus } from 'src/entregas/enums/delivery-status.enum';

@Injectable()
export class LojistasService {
  constructor(
    @InjectModel(Lojista.name) private lojistaModel: Model<LojistaDocument>,
    @InjectModel(Delivery.name) private deliveryModel: Model<Delivery>,
    @InjectModel(Socorro.name) private socorroModel: Model<Socorro>,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  async getDashboardSummary(solicitanteId: string) {
    const id = new Types.ObjectId(solicitanteId);

    const statusConcluido = [DeliveryStatus.FINALIZADO];

    const statusEmAndamento = [
      DeliveryStatus.PENDENTE,
      DeliveryStatus.ACEITO,
      DeliveryStatus.A_CAMINHO,
      DeliveryStatus.EM_ATENDIMENTO,
    ];

    const statusCancelado = [DeliveryStatus.CANCELADO];

    const deliverySummary = await this.deliveryModel.aggregate([
      { $match: { solicitanteId: id } },
      {
        $group: {
          _id: null,
          concluidas: {
            $sum: { $cond: [{ $in: ['$status', statusConcluido] }, 1, 0] },
          },
          emAndamento: {
            $sum: { $cond: [{ $in: ['$status', statusEmAndamento] }, 1, 0] },
          },
          canceladas: {
            $sum: { $cond: [{ $in: ['$status', statusCancelado] }, 1, 0] },
          },
        },
      },
    ]);

    const socorroSummary = await this.socorroModel.aggregate([
      { $match: { solicitanteId: id } },
      {
        $group: {
          _id: null,
          concluidas: {
            $sum: { $cond: [{ $in: ['$status', statusConcluido] }, 1, 0] },
          },
          emAndamento: {
            $sum: { $cond: [{ $in: ['$status', statusEmAndamento] }, 1, 0] },
          },
          canceladas: {
            $sum: { $cond: [{ $in: ['$status', statusCancelado] }, 1, 0] },
          },
        },
      },
    ]);

    const totalConcluidas =
      (deliverySummary[0]?.concluidas || 0) +
      (socorroSummary[0]?.concluidas || 0);
    const totalEmAndamento =
      (deliverySummary[0]?.emAndamento || 0) +
      (socorroSummary[0]?.emAndamento || 0);
    const totalCanceladas =
      (deliverySummary[0]?.canceladas || 0) +
      (socorroSummary[0]?.canceladas || 0);

    return {
      concluidas: totalConcluidas,
      emAndamento: totalEmAndamento,
      canceladas: totalCanceladas,
    };
  }

  async findById(id: string): Promise<Lojista | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.lojistaModel.findById(id).exec();
  }

  async create(createLojistaDto: CreateLojistaDto): Promise<Lojista> {
    const { email, endereco } = createLojistaDto;

    const existingLojista = await this.findOneByEmail(email);
    if (existingLojista) {
      throw new ConflictException('Este email já está cadastrado.');
    }

    const coordinates = await this.googleMapsService.geocodeAddress(endereco);

    const dadosCompletosDoLojista = {
      ...createLojistaDto,
      coordinates: coordinates,
    };

    const createdLojista = new this.lojistaModel(dadosCompletosDoLojista);

    return createdLojista.save();
  }

  async update(
    id: string,
    updateLojistaDto: UpdateLojistaDto,
  ): Promise<Lojista | null> {
    if (updateLojistaDto.password) {
      const salt = await bcrypt.genSalt();
      updateLojistaDto.password = await bcrypt.hash(
        updateLojistaDto.password,
        salt,
      );
    }

    if (updateLojistaDto.endereco) {
      const coordinates = await this.googleMapsService.geocodeAddress(
        updateLojistaDto.endereco,
      );
      (updateLojistaDto as any).coordinates = coordinates;
    }

    return this.lojistaModel
      .findByIdAndUpdate(id, updateLojistaDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Lojista | null> {
    return this.lojistaModel.findByIdAndDelete(id).exec();
  }

  async findAll(query: { page: number; limit: number }) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [lojistas, total] = await Promise.all([
      this.lojistaModel
        .find()
        .sort({ nomeFantasia: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.lojistaModel.countDocuments(),
    ]);

    return {
      data: lojistas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneByEmail(email: string) {
    return this.lojistaModel.findOne({ email }).exec();
  }
  async findOneByEmailWithPassword(email: string) {
    return this.lojistaModel.findOne({ email }).select('+password').exec();
  }

  async validatePassword(email: string, pass: string): Promise<any> {
    const lojista = await this.findOneByEmailWithPassword(email);
    if (lojista && (await bcrypt.compare(pass, lojista.password))) {
      const { password, ...result } = lojista.toObject();
      return result;
    }
    return null;
  }

  async findAllForSelection(): Promise<Lojista[]> {
    return this.lojistaModel.find().select('_id nomeFantasia').exec();
  }
}
