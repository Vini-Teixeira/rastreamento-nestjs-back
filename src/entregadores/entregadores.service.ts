import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entregador, EntregadorDocument } from './schemas/entregador.schema';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import * as bcrypt from 'bcrypt';
import { Delivery } from 'src/entregas/schemas/delivery.schema';
import { Socorro } from 'src/socorros/schemas/socorro.schema';
import { PontoHistoryService } from 'src/ponto-history/ponto-history.service';
import { PontoAction } from 'src/ponto-history/schemas/ponto-history.schema';
import { Job } from './interfaces/job.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

const logger = new Logger('EntregadoresService');

@Injectable()
export class EntregadoresService {
  private readonly logger = new Logger(EntregadoresService.name);
  constructor(
    @InjectModel(Delivery.name) private readonly deliveryModel: Model<Delivery>,
    @InjectModel(Socorro.name) private readonly socorroModel: Model<Socorro>,
    @InjectModel(Entregador.name) private entregadorModel: Model<EntregadorDocument>,
    private readonly pontoHistoryService: PontoHistoryService,
  ) {}

  async updateHeartbeat(driverId: string): Promise<void> {
    const result = await this.entregadorModel
      .updateOne(
        { _id: driverId },
        {
          $set: {
            lastHeartbeat: new Date(),
            ativo: true,
          },
        },
      )
      .exec();
    if (result.modifiedCount === 0) {
      throw new NotFoundException(
        `Entregador com ID ${driverId} não encontrado para o hearbeat.`,
      );
    }
  }

  async markAsActive(driverId: string): Promise<void> {
    const driverObjectId = new Types.ObjectId(driverId)
    await Promise.all([
      this.entregadorModel.updateOne(
        { _id: driverObjectId },
        { 
          $set: {
            ativo: true,
            lastHeartbeat: new Date()
          }
         }
      ).exec(),
      this.pontoHistoryService.registrarPonto(driverObjectId, PontoAction.LOGIN)
    ])
    this.logger.log(`Entregador ${driverId} reativado via login e ponto registrado.`)
  }

  async registerLogout(driverId: string): Promise<void> {
    const driverObjectId = new Types.ObjectId(driverId)
    await this.pontoHistoryService.registrarPonto(driverObjectId, PontoAction.LOGOUT)
    this.logger.log(`Ponto de Logout registrado para o entregador ${driverId}.`)
  }

  async validatePassword(
    telefone: string,
    pass: string,
  ): Promise<EntregadorDocument | any> {
    const driver = await this.entregadorModel
      .findOne({ telefone })
      .select('+password')
      .exec();
    if (driver && (await bcrypt.compare(pass, driver.password))) {
      const { password, ...result } = driver.toObject();
      return result;
    }
    return null;
  }

  async create(createEntregadorDto: CreateEntregadorDto): Promise<Entregador> {
  const newEntregador = new this.entregadorModel({
    ...createEntregadorDto, 
    ativo: true, 
  });
  return newEntregador.save();
}

async update(
    id: string,
    updateEntregadorDto: UpdateEntregadorDto,
  ): Promise<EntregadorDocument | null> {
    const entregador = await this.entregadorModel.findById(id).exec();
    if (!entregador) {
      return null;
    }

    Object.assign(entregador, updateEntregadorDto);
    return entregador.save();
  }

  async findOneByPhoneWithPassword(
    telefone: string,
  ): Promise<EntregadorDocument | null> {
    return this.entregadorModel
      .findOne({ telefone })
      .select('+password')
      .exec();
  }

  async findOne(id: string): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findById(id).exec();
  }

  async findAll(query: { page: number; limit: number }) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [entregadores, total] = await Promise.all([
      this.entregadorModel
        .find()
        .sort({ nome: 1 })
        .populate('lojaBaseId', 'nomeFantasia')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.entregadorModel.countDocuments(),
    ]);
    return {
      data: entregadores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<EntregadorDocument | null> {
    return this.entregadorModel.findByIdAndDelete(id).exec();
  }

  async updateLocation(
    driverId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<EntregadorDocument> {
    const { lat, lng } = updateLocationDto;

    logger.log(
      `updateLocation -> driverId: ${driverId} | lat:${lat} lng:${lng}`,
    );

    const geoJsonPoint = {
      type: 'Point' as const,
      coordinates: [lng, lat],
    };

    const updatedDriver = await this.entregadorModel
      .findByIdAndUpdate(
        driverId,
        { $set: { localizacao: geoJsonPoint } },
        { new: true },
      )
      .exec();

    if (!updatedDriver) {
      logger.warn(
        `Entregador não encontrado (id: ${driverId}) ao tentar atualizar localização.`,
      );
      throw new NotFoundException(
        `Entregador com ID ${driverId} não encontrado.`,
      );
    }

    logger.log(`updateLocation -> sucesso para entregador ${driverId}`);
    return updatedDriver;
  }

  async findMyJobs(driverId: string) {
    const activeStatuses = [
      'pending',
      'accepted',
      'on_the_way',
      'instalando',
      'on_site',
      'pendente',
      'aceito',
      'à_caminho',
      'no_local',
    ];

    const driverObjectId = new Types.ObjectId(driverId);
    const [deliveries, socorros] = await Promise.all([
      this.deliveryModel
        .find({
          driverId: driverObjectId,
          status: { $in: activeStatuses },
        })
        .exec(),
      this.socorroModel
        .find({
          driverId: driverObjectId,
          status: { $in: activeStatuses },
        })
        .exec(),
    ]);

    const mappedDeliveries = deliveries.map((d) => ({
      ...d.toObject(),
      createdAt: d.createdAt ?? new Date(),
      type: 'entrega' as const,
    }));

    const mappedSocorros = socorros.map((s) => ({
      ...s.toObject(),
      createdAt: s.createdAt ?? new Date(),
      type: 'socorro' as const,
    }));

    const allJobs: Job[] = [...mappedDeliveries, ...mappedSocorros];

    allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return allJobs;
  }

  async updateFcmToken(driverId: string, fcmToken: string): Promise<void> {
    await this.entregadorModel.updateOne(
      { _id: driverId },
      { $set: { fcmToken: fcmToken } }
    ).exec()
    this.logger.log(`FCM token atualizado para o entregador ${driverId}.`)
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkStaleHeartbeats() {
    this.logger.log('A verificar heartbeats de entregadores...');
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() - 2);
    const query = {
      ativo: true,
      lastHeartbeat: { $lt: threshold },
    };
    const result = await this.entregadorModel
      .updateMany(query, { $set: { ativo: false } })
      .exec();
    if (result.modifiedCount > 0) {
      this.logger.warn(
        `Desativados ${result.modifiedCount} entregadores por inatividade.`,
      );
    }
  }
}

export type DeliveryDocument = Delivery & Document;
export type SocorroDocument = Socorro & Document;
