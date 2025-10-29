import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import {
  Delivery,
  DeliveryDocument,
  Coordinates,
} from './schemas/delivery.schema';
import { DeliveryStatus } from './enums/delivery-status.enum';
import {
  Entregador,
  EntregadorDocument,
} from '../entregadores/schemas/entregador.schema';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { RejeicaoDto } from './dto/rejeicao.dto';
import { InstalandoDto } from './dto/instalando.dto';
import { FcmService } from 'src/fcm/fcm.service';
import { Lojista } from 'src/lojistas/schemas/lojista.schema';

type LatLng = { lat: number; lng: number };

function toGeoJSONPoint(lat: number, lng: number): Coordinates {
  return { type: 'Point', coordinates: [lng, lat] } as Coordinates;
}

function toGeoJSONWithTimestamp(
  lat: number,
  lng: number,
  timestamp?: Date,
): Coordinates {
  const p = toGeoJSONPoint(lat, lng) as any;
  if (timestamp) p.timestamp = timestamp;
  return p as Coordinates;
}

function getLatLngFromGeoJSONOrLatLng(input: Coordinates | LatLng): LatLng {
  if (
    (input as any)?.type === 'Point' &&
    Array.isArray((input as any).coordinates)
  ) {
    const [lng, lat] = (input as any).coordinates;
    return { lat, lng };
  }
  return input as LatLng;
}

function isObjectIdLike(value: any): boolean {
  if (!value) return false;
  if (value instanceof Types.ObjectId) return true;
  if (typeof value === 'string' && Types.ObjectId.isValid(value)) return true;
  if (value._id && Types.ObjectId.isValid(String(value._id))) return true;
  return false;
}

interface NearestDriverResult extends EntregadorDocument {
  distanciaCalculada: number;
}

@Injectable()
export class EntregasService {
  private readonly logger = new Logger(EntregasService.name);

  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Entregador.name)
    private entregadorModel: Model<EntregadorDocument>,
    private googleMapsService: GoogleMapsService,
    @Inject(forwardRef(() => EntregadoresGateway))
    private entregadoresGateway: EntregadoresGateway,
    @InjectConnection() private readonly connection: Connection,
    private schedulerRegistry: SchedulerRegistry,
    private readonly fcmService: FcmService,
    @InjectModel(Lojista.name) private readonly lojistaModel: Model<Lojista>,
  ) {}

  public async findNearestDriverInfo(
    originCoordinates: Coordinates | LatLng,
    excludeDriverIds: string[] = [],
  ): Promise<NearestDriverResult | null> {
    const { lat, lng } = getLatLngFromGeoJSONOrLatLng(originCoordinates);

    const query: any = {
      ativo: true,
      emEntrega: false,
      localizacao: { $exists: true },
    };
    if (excludeDriverIds.length > 0) {
      query._id = {
        $nin: excludeDriverIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const drivers = await this.entregadorModel.aggregate<NearestDriverResult>([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanciaCalculada',
          query: query,
          spherical: true,
        },
      },
      { $limit: 1 },
    ]);

    return drivers.length > 0 ? drivers[0] : null;
  }

  private async _findAndReassignDelivery(
    delivery: DeliveryDocument,
    session?: ClientSession,
  ) {
    this.logger.log(
      `Procurando novo entregador para a entrega ${delivery.id}...`,
    );

    const excludedDriverIds = delivery.historicoRejeicoes
      .filter((rejeicao) => rejeicao.motivo !== 'Recusa Automática')
      .map((rejeicao) => rejeicao.driverId.toString());

    this.logger.log(
      `Excluindo os seguintes entregadores da busca: [${excludedDriverIds.join(', ')}]`,
    );

    const newDriver = await this.findNearestDriverInfo(
      delivery.origin.coordinates,
      excludedDriverIds,
    );

    if (newDriver) {
      this.logger.log(`Novo entregador ${newDriver.nome} encontrado...`);
      delivery.driverId = newDriver._id;
      await delivery.save({ session });
      this.entregadoresGateway.notifyNewDelivery(
        newDriver._id.toString(),
        delivery,
      );

      const timeoutName = `delivery-timeout-${delivery.id}`;
      const timeout = setTimeout(
        () => this.handleDeliveryTimeout(delivery.id, newDriver._id.toString()),
        32000,
      );
      this.schedulerRegistry.addTimeout(timeoutName, timeout);
      this.logger.log(`Timeout de 14s agendado para a entrega ${delivery.id}`);
    } else {
      this.logger.warn(
        `Nenhum outro entregador disponível. A entrega ${delivery.id} voltará para a fila.`,
      );
      delivery.driverId = undefined;
      await delivery.save({ session });
    }
  }

  async create(
    createDeliveryDto: CreateDeliveryDto,
    solicitanteId: string,
  ): Promise<Delivery> {
    const { destination, itemDescription, origemId } = createDeliveryDto;

    const idDaLojaDeOrigem = origemId || solicitanteId;
    const lojaDeOrigem = await this.lojistaModel
      .findById(idDaLojaDeOrigem)
      .exec();
    if (!lojaDeOrigem) {
      throw new NotFoundException(
        `Loja de origem com ID ${idDaLojaDeOrigem} não encontrada.`,
      );
    }

    const nearestDriverInfo = await this.findNearestDriverInfo(
      lojaDeOrigem.coordinates as any,
    );
    if (!nearestDriverInfo) {
      throw new NotFoundException(
        'Nenhum entregador disponível foi encontrado perto da loja de origem.',
      );
    }
    this.logger.log(
      `Entregador mais próximo: ${nearestDriverInfo.nome} a ${nearestDriverInfo.distanciaCalculada.toFixed(0)} metros.`,
    );
    let destinationGeo: Coordinates;
    try {
      destinationGeo = await this.googleMapsService.geocodeAddress(
        destination.address,
      );
    } catch (error) {
      throw new BadRequestException(
        'O endereço de destino não pôde ser encontrado.',
      );
    }

    let codigoUnico: string = '';
    let codigoJaExiste = true;
    while (codigoJaExiste) {
      codigoUnico = gerarCodigoAleatorio(6);
      const entregaExistente = await this.deliveryModel
        .findOne({
          codigoEntrega: codigoUnico,
        })
        .exec();
      if (!entregaExistente) {
        codigoJaExiste = false;
      }
    }
    this.logger.log(`Código de entrega único gerado: ${codigoUnico}`);
    const newDelivery = new this.deliveryModel({
      solicitanteId: new Types.ObjectId(solicitanteId),
      origemId: new Types.ObjectId(idDaLojaDeOrigem),
      itemDescription,
      status: DeliveryStatus.PENDENTE,
      origin: {
        address: lojaDeOrigem.endereco,
        coordinates: lojaDeOrigem.coordinates,
      },
      destination: {
        address: destination.address,
        coordinates: destinationGeo,
      },
      driverId: nearestDriverInfo._id,
      codigoEntrega: codigoUnico,
    });

    const saved = await newDelivery.save();
    try {
      this.entregadoresGateway.notifyNewDelivery(
        nearestDriverInfo._id.toString(),
        saved,
      );
      if (nearestDriverInfo.fcmToken) {
        this.fcmService.sendPushNotification(
          nearestDriverInfo.fcmToken,
          'Nova Entrega Disponível!',
          `Destino: ${saved.destination.address}`,
          { deliveryId: saved.id, type: 'entrega' },
        );
      }
      this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
    } catch (err) {
      this.logger.error('Falha ao notificar o entregador', (err as any)?.stack);
    }

    return saved.toObject();
  }

  async recusarEntrega(
    deliveryId: string,
    driverId: string,
    rejeicaoDto: RejeicaoDto,
  ) {
    const timeoutName = `delivery-timeout-${deliveryId}`;
    try {
      if (this.schedulerRegistry.doesExist('timeout', timeoutName)) {
        this.schedulerRegistry.deleteTimeout(timeoutName);
        this.logger.log(
          `Timeout para a entrega ${deliveryId} cancelado devido a recusa manual.`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `Falha ao tentar apagar o timeout ${timeoutName}. Pode já ter sido executado.`,
      );
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const delivery = await this.deliveryModel
        .findById(deliveryId)
        .session(session);
      if (!delivery) {
        throw new NotFoundException('Entrega não encontrada.');
      }
      if (delivery.driverId?.toString() !== driverId) {
        throw new ForbiddenException(
          'Você não pode recusar uma entrega que não é sua.',
        );
      }
      if (delivery.status !== DeliveryStatus.PENDENTE) {
        throw new BadRequestException(
          'Esta entrega não pode mais ser recusada.',
        );
      }

      delivery.historicoRejeicoes.push({
        ...rejeicaoDto,
        driverId: new Types.ObjectId(driverId),
        timestamp: new Date(),
      });

      await delivery.save({ session });

      if (delivery.historicoRejeicoes.length >= 3) {
        this.logger.warn(
          `A entrega ${deliveryId} foi recusada ${delivery.historicoRejeicoes.length} vezes. Notificando administrador...`,
        );
      }

      await this._findAndReassignDelivery(delivery, session);

      await session.commitTransaction();
      return { message: 'Entrega recusada e reatribuída com sucesso.' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async handleDeliveryTimeout(deliveryId: string, driverId: string) {
    this.logger.log(
      `Verificando timeout para a entrega ${deliveryId} do entregador ${driverId}...`,
    );
    const delivery = await this.deliveryModel.findById(deliveryId);
    if (
      delivery &&
      delivery.status === DeliveryStatus.PENDENTE &&
      delivery.driverId?.toString() === driverId
    ) {
      this.logger.warn(
        `Timeout! Entregador ${driverId} não respondeu. Recusa automática iniciada.`,
      );
      const rejeicaoDto: RejeicaoDto = {
        motivo: 'Recusa automática',
        texto: 'O entregador não respondeu a tempo.',
      };
      await this.recusarEntrega(deliveryId, driverId, rejeicaoDto);
    } else {
      this.logger.log(
        `Timeout para ${deliveryId} ignorado. Entrega já foi aceita ou recusada.`,
      );
    }
  }

  async acceptDelivery(id: string, driverId: string): Promise<Delivery> {
    const timeoutName = `delivery-timeout-${id}`;
    if (this.schedulerRegistry.doesExist('timeout', timeoutName)) {
      try {
        this.schedulerRegistry.deleteTimeout(timeoutName);
        this.logger.log(`Timeout para a entrega ${id} cancelado`);
      } catch (e) {
        this.logger.warn(
          `Falha ao deletar timeout ${timeoutName} em acceptDelivery. Pode já ter sido executado.`,
        );
      }
    }

    const [delivery, driver] = await Promise.all([
      this.deliveryModel.findById(id).populate('driverId').exec(),
      this.entregadorModel.findById(driverId).exec(),
    ]);

    if (!delivery)
      throw new NotFoundException(`Entrega com ID ${id} não encontrada.`);
    if (!driver)
      throw new NotFoundException(
        `Entregador com ID ${driverId} não encontrado.`,
      );

    const assignedDriverId = delivery.driverId
      ? ((delivery.driverId as any)._id ?? delivery.driverId).toString()
      : null;

    if (assignedDriverId && assignedDriverId !== driverId) {
      throw new ForbiddenException('Entrega atribuída a outro entregador.');
    }
    if (delivery.status !== DeliveryStatus.PENDENTE) {
      throw new BadRequestException(
        'Entrega não está mais disponível para aceitar.',
      );
    }
    // --- FIM DAS VALIDAÇÕES ---

    const session = await this.connection.startSession();
    session.startTransaction();
    let saved: DeliveryDocument | null = null;

    try {
      delivery.status = DeliveryStatus.ACEITO;
      delivery.driverId = driver._id as any;
      if (driver.localizacao) {
        delivery.driverCurrentLocation = driver.localizacao;
        this.logger.log(
          `Definindo driverCurrentLocation inicial para entrega ${id} com base no entregador ${driverId}`,
        );
      } else {
        this.logger.warn(
          `Entregador ${driverId} sem localização registrada ao aceitar ${id}. driverCurrentLocation ficará nulo.`,
        );
        delivery.driverCurrentLocation = undefined;
      }
      const savedDeliveryPromise = delivery.save({ session });
      const updateDriverPromise = this.entregadorModel
        .updateOne(
          { _id: driverId },
          { $set: { emEntrega: true, recusasConsecutivas: 0 } },
          { session },
        )
        .exec();
      [saved] = await Promise.all([savedDeliveryPromise, updateDriverPromise]);

      await session.commitTransaction();
      this.logger.log(`Transação para aceitar entrega ${id} concluída.`);
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Transação para aceitar ${id} FALHOU e foi revertida.`,
        (error as any)?.stack,
      );
      throw error;
    } finally {
      session.endSession();
    }
    if (saved) {
      try {
        this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
      } catch (err) {
        this.logger.error(
          'Falha ao emitir delivery_update após aceitar entrega.',
          (err as any)?.stack,
        );
      }
      return saved.toObject();
    } else {
      this.logger.error(
        `Aceite da entrega ${id} concluído, mas objeto 'saved' nulo. Buscando novamente...`,
      );
      const finalDelivery = await this.findOne(id);
      if (!finalDelivery)
        throw new InternalServerErrorException(
          'Falha ao buscar entrega após aceite.',
        );
      return finalDelivery;
    }
  }

  async collectItem(id: string, driverId: string): Promise<Delivery> {
    const [delivery, driver] = await Promise.all([
      this.deliveryModel.findById(id).exec(),
      this.entregadorModel.findById(driverId).exec(),
    ]);

    // --- Validações ---
    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada.');
    }
    if (!driver) {
      throw new NotFoundException(
        `Entregador com ID ${driverId} não encontrado.`,
      );
    }

    const assigned = (delivery.driverId as any)?.toString() ?? null;
    if (!assigned || assigned !== driverId) {
      throw new UnauthorizedException(
        'Você não tem permissão para modificar esta entrega.',
      );
    }
    if (delivery.status !== DeliveryStatus.ACEITO) {
      throw new ForbiddenException(
        'Apenas entregas com status ACEITO podem ser coletadas.',
      );
    }

    // --- Atualizações ---
    delivery.status = DeliveryStatus.A_CAMINHO;

    if (driver.localizacao) {
      delivery.driverCurrentLocation = driver.localizacao;
      this.logger.log(
        `Atualizando driverCurrentLocation na coleta para entrega ${id}`,
      );

      const now = new Date();
      const currentGeoPoint = {
        type: 'Point',
        coordinates: [
          driver.localizacao.coordinates[0],
          driver.localizacao.coordinates[1],
        ],
        timestamp: now,
      };

      delivery.routeHistory = [currentGeoPoint];
      this.logger.log(
        `[EntregasService] Histórico reiniciado ao coletar item da entrega ${id}. Novo ponto inicial: ${currentGeoPoint.coordinates}`,
      );
    } else {
      this.logger.warn(
        `Entregador ${driverId} sem localização registrada ao coletar item para ${id}. driverCurrentLocation não será atualizado.`,
      );
    }

    const saved = await delivery.save();

    this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
    return saved;
  }

  async liberarCheckInManual(
    deliveryId: string,
    solicitanteId: string,
  ): Promise<Delivery> {
    const delivery = await this.deliveryModel.findById(deliveryId).exec();

    if (!delivery) {
      throw new NotFoundException(
        `Entrega com ID ${deliveryId} não encontrada.`,
      );
    }

    if (delivery.solicitanteId.toString() !== solicitanteId) {
      throw new ForbiddenException(
        'Você não tem permissão para modificar esta entrega',
      );
    }

    const statusPermitidos = [DeliveryStatus.ACEITO, DeliveryStatus.A_CAMINHO];
    if (!statusPermitidos.includes(delivery.status)) {
      throw new BadRequestException(
        `Não é possível liberar o CheckIn para uma entrega com status "${delivery.status}".`,
      );
    }
    delivery.checkInLiberadoManualmente = true;

    const saved = await delivery.save();
    this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
    return saved;
  }

  async realizarCheckIn(
    deliveryId: string,
    driverId: string,
    instalandoDto: InstalandoDto,
  ): Promise<Delivery> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const delivery = await this.deliveryModel
        .findById(deliveryId)
        .session(session);
      if (!delivery) throw new NotFoundException('Entrega não encontrada');
      if (delivery.driverId?.toString() !== driverId) {
        throw new ForbiddenException('Esta entrega não lhe pertence.');
      }
      if (
        delivery.codigoEntrega !== instalandoDto.codigoEntrega &&
        !delivery.checkInLiberadoManualmente
      ) {
        throw new BadRequestException('Código de confirmação inválido.');
      }
      delivery.status = DeliveryStatus.EM_ATENDIMENTO;
      const deliverySavePromise = delivery.save({ session });
      const driverUpdatePromise = this.entregadorModel
        .updateOne(
          { _id: driverId },
          { $set: { emEntrega: false } },
          { session },
        )
        .exec();
      const [savedDelivery] = await Promise.all([
        deliverySavePromise,
        driverUpdatePromise,
      ]);
      await session.commitTransaction();
      this.entregadoresGateway.notifyDeliveryStatusChanged(savedDelivery);
      return savedDelivery;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async finishDelivery(id: string, driverId: string): Promise<Delivery> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const delivery = await this.deliveryModel
        .findById(id)
        .session(session)
        .exec();

      if (!delivery) {
        throw new NotFoundException(`Entrega com ID ${id} não encontrada.`);
      }

      const assigned = (delivery.driverId as any)?.toString() ?? null;
      if (!assigned || assigned !== driverId) {
        throw new UnauthorizedException(
          'Você não tem permissão para finalizar esta entrega.',
        );
      }

      if (delivery.status !== DeliveryStatus.EM_ATENDIMENTO) {
        throw new ForbiddenException(
          'Apenas entregas "a caminho" podem ser finalizadas.',
        );
      }

      delivery.status = DeliveryStatus.FINALIZADO;
      const savedDeliveryPromise = delivery.save({ session });

      const updateDriverPromise = this.entregadorModel
        .updateOne(
          { _id: delivery.driverId },
          { $set: { emEntrega: false } },
          { session },
        )
        .exec();

      const [savedDelivery] = await Promise.all([
        savedDeliveryPromise,
        updateDriverPromise,
      ]);

      await session.commitTransaction();
      this.entregadoresGateway.notifyDeliveryStatusChanged(savedDelivery);
      return savedDelivery;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelarEntrega(
    deliveryId: string,
    solicitanteId: string,
  ): Promise<Delivery> {
    const session = await this.connection.startSession();
    session.startTransaction();
    this.logger.log(`Iniciando transação para cancelar entrega ${deliveryId}`);

    try {
      const delivery = await this.deliveryModel
        .findById(deliveryId)
        .session(session)
        .exec();

      if (!delivery) {
        throw new NotFoundException(
          `Entrega com ID "${deliveryId}" não encontrada.`,
        );
      }

      if (delivery.solicitanteId.toString() !== solicitanteId) {
        throw new ForbiddenException(
          'Você não tem permissão para cancelar esta entrega.',
        );
      }

      const nonCancelableStatuses = [
        DeliveryStatus.FINALIZADO,
        DeliveryStatus.CANCELADO,
      ];
      if (nonCancelableStatuses.includes(delivery.status)) {
        throw new BadRequestException(
          'Esta entrega não pode mais ser cancelada.',
        );
      }

      const driverId = delivery.driverId;
      const driverEstaAtivo =
        driverId &&
        [
          DeliveryStatus.ACEITO,
          DeliveryStatus.A_CAMINHO,
          DeliveryStatus.EM_ATENDIMENTO,
        ].includes(delivery.status);

      delivery.status = DeliveryStatus.CANCELADO;

      const deliverySavePromise = delivery.save({ session });
      const promises: any[] = [deliverySavePromise];

      if (driverEstaAtivo) {
        this.logger.log(
          `Liberando entregador ${driverId} da entrega cancelada ${deliveryId}.`,
        );
        promises.push(
          this.entregadorModel
            .updateOne(
              { _id: driverId },
              { $set: { emEntrega: false } },
              { session },
            )
            .exec(),
        );
      }
      const [savedDelivery] = await Promise.all(promises);

      await session.commitTransaction();
      this.logger.log(
        `Transação de cancelamento para ${deliveryId} concluída.`,
      );
      this.entregadoresGateway.notifyDeliveryStatusChanged(savedDelivery);

      return savedDelivery;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Erro na transação de cancelamento da entrega ${deliveryId}`,
        (error as any)?.stack,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleStaleDeliveries() {
    this.logger.log('Executando verificação de entregas pendentes...');
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const staleDeliveries = await this.deliveryModel
      .find({
        status: DeliveryStatus.PENDENTE,
        createdAt: { $lt: oneMinuteAgo },
      })
      .exec();

    if (staleDeliveries.length === 0) {
      this.logger.log('Nenhuma entrega pendente encontrada.');
      return;
    }
    this.logger.warn(
      `Encontradas ${staleDeliveries.length} entregas pendentes. Tentando reatribuir...`,
    );
    for (const delivery of staleDeliveries) {
      await this._findAndReassignDelivery(delivery);
    }
  }

  async findAll(query: { page: number; limit: number; status?: string }) {
    const { page = 1, limit = 8, status } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (status) {
      const statusArray = status.split(',');
      const regexArray = statusArray.map((s) => new RegExp(`^${s}$`, 'i'));
      filter.status = { $in: regexArray };
    }

    const [deliveries, total] = await Promise.all([
      this.deliveryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.deliveryModel.countDocuments(filter),
    ]);

    return {
      deliveries: deliveries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllBySolicitanteId(
    solicitanteId: string,
    page = 1,
    limit = 10,
    status?: string,
  ) {
    this.logger.debug(
      `Buscando entregas para o Lojista ID: ${solicitanteId} com status: ${status}`,
    );
    const skip = (page - 1) * limit;

    const query: any = { solicitanteId: new Types.ObjectId(solicitanteId) };
    if (status) {
      const statusArray = status.split(',');
      const regexArray = statusArray.map((s) => new RegExp(`^${s}$`, 'i'));
      query.status = { $in: regexArray };
    }

    this.logger.debug(`Query enviada para o MongoDB: ${JSON.stringify(query)}`);

    try {
      const [deliveries, total] = await Promise.all([
        this.deliveryModel
          .find(query)
          .populate('driverId', 'nome')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.deliveryModel.countDocuments(query).exec(),
      ]);

      this.logger.debug(`Encontradas ${total} entregas para este lojista.`);
      const plainDeliveries = deliveries.map((d) => d.toObject());

      this.logger.debug(
        `Dados retornados (após serialização): ${JSON.stringify(
          plainDeliveries,
        )}`,
      );
      return { deliveries: plainDeliveries, total, page, limit };
    } catch (error) {
      this.logger.error(
        `Erro ao executar a busca por solicitanteId: ${solicitanteId}`,
        error,
      );
      throw error;
    }
  }

  async findFilteredAndPaginated(
    statuses: DeliveryStatus[],
    page = 1,
    limit = 8,
  ): Promise<{
    deliveries: Delivery[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const query = statuses?.length ? { status: { $in: statuses } } : {};

    try {
      const [deliveries, total] = await Promise.all([
        this.deliveryModel
          .find(query)
          .populate('driverId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.deliveryModel.countDocuments(query).exec(),
      ]);

      return { deliveries: deliveries || [], total, page, limit };
    } catch (error) {
      this.logger.error(
        'Falha ao buscar entregas paginadas',
        (error as any)?.stack,
      );
      return { deliveries: [], total: 0, page, limit };
    }
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryModel
      .findById(id)
      .populate('driverId')
      .exec();
    if (!delivery)
      throw new NotFoundException(`Entrega com ID "${id}" não encontrada.`);
    return delivery;
  }

  async update(
    id: string,
    updateDeliveryDto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    const existingDelivery = await this.deliveryModel.findById(id).exec();
    if (!existingDelivery) {
      throw new NotFoundException(
        `Entrega com ID "${id}" não encontrada para atualização.`,
      );
    }

    if (updateDeliveryDto.status)
      existingDelivery.status = updateDeliveryDto.status;
    if (updateDeliveryDto.driverId)
      existingDelivery.driverId = new Types.ObjectId(
        updateDeliveryDto.driverId,
      ) as any;
    if (updateDeliveryDto.itemDescription)
      existingDelivery.itemDescription = updateDeliveryDto.itemDescription;

    if (updateDeliveryDto.routeHistory?.length) {
      existingDelivery.routeHistory = updateDeliveryDto.routeHistory.map((p) =>
        toGeoJSONWithTimestamp(
          p.lat,
          p.lng,
          p.timestamp ? new Date(p.timestamp) : new Date(),
        ),
      ) as any;
    }

    if (updateDeliveryDto.driverCurrentLocation) {
      const p = updateDeliveryDto.driverCurrentLocation;
      existingDelivery.driverCurrentLocation = toGeoJSONWithTimestamp(
        p.lat,
        p.lng,
        p.timestamp ? new Date(p.timestamp) : new Date(),
      ) as any;
    }

    const saved = await existingDelivery.save();

    try {
      this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
    } catch (err) {
      this.logger.error(
        'Falha ao emitir delivery_updated após update()',
        (err as any)?.stack,
      );
    }
    return saved;
  }

  async delete(id: string): Promise<void> {
    const result = await this.deliveryModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Entrega com ID "${id}" não encontrada para exclusão.`,
      );
    }
  }

  async findAllByDriverId(driverId: string, status?: DeliveryStatus[]) {
    const query: any = {
      driverId: isObjectIdLike(driverId)
        ? new Types.ObjectId(driverId)
        : driverId,
    };
    if (status?.length) query.status = { $in: status };
    return (await this.deliveryModel.find(query).exec()) || [];
  }

  async addRoutePoint(
    deliveryId: string,
    lat: number,
    lng: number,
  ): Promise<Delivery> {
    const delivery = await this.deliveryModel.findById(deliveryId).exec();
    if (!delivery) {
      throw new NotFoundException(
        `Entrega com ID "${deliveryId}" não encontrada para adicionar ponto de rota.`,
      );
    }

    if (!delivery.routeHistory) delivery.routeHistory = [];
    delivery.routeHistory.push(toGeoJSONWithTimestamp(lat, lng, new Date()));

    return delivery.save();
  }

  async updateDriverLocation(
    deliveryId: string,
    lat: number,
    lng: number,
  ): Promise<Delivery> {
    const delivery = await this.deliveryModel.findById(deliveryId).exec();
    if (!delivery) {
      throw new NotFoundException(
        `Entrega com ID "${deliveryId}" não encontrada para atualizar localização do entregador.`,
      );
    }
    const now = new Date();
    const geoPoint = toGeoJSONWithTimestamp(lat, lng, now);
    (delivery as any).driverCurrentLocation = geoPoint as any;
    if (!Array.isArray(delivery.routeHistory)) {
      delivery.routeHistory = [];
    }
    delivery.routeHistory.push(geoPoint as any);

    const payload = {
      deliveryId,
      driverId: delivery.driverId ? String(delivery.driverId) : null,
      location: {
        type: geoPoint.type,
        coordinates: geoPoint.coordinates,
        timestamp: now.toISOString(),
      },
      routeHistory: delivery.routeHistory.map((point) => ({
        type: point.type,
        coordinates: point.coordinates,
        timestamp: point.timestamp,
      })),
    };
    const updatedDelivery = await delivery.save();

    try {
      // --- LOG DE DEBUG ---
      this.logger.log(
        `[WS] Emitindo 'novaLocalizacao' para ${deliveryId}. Histórico com ${payload.routeHistory.length} pontos.`,
      );
      // --- FIM DO LOG ---
      this.entregadoresGateway.emitDriverLocation(deliveryId, payload);
    } catch (err) {
      this.logger.error(
        'Falha ao emitir novaLocalizacao via WebSocket',
        (err as any)?.stack,
      );
    }
    return updatedDelivery;
  }

  async getSnappedRoutePolyline(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<string> {
    return this.googleMapsService.getDirections(origin, destination);
  }

  async getDriverToDestinationPolyline(
    driverLocation: Coordinates,
    destination: Coordinates,
  ): Promise<string> {
    return this.googleMapsService.getDirections(driverLocation, destination);
  }

  async bulkUpdateDriverLocations(
    driverId: string,
    locations: Array<{
      deliveryId: string;
      lat: number;
      lng: number;
      timestamp: Date;
    }>,
  ): Promise<void> {
    this.logger.log(
      `Sincronizando ${locations.length} pontos de localização para o entregador ${driverId}`,
    );

    const byDelivery = new Map<
      string,
      Array<{ deliveryId: string; lat: number; lng: number; timestamp: Date }>
    >();
    for (const loc of locations) {
      if (!byDelivery.has(loc.deliveryId)) byDelivery.set(loc.deliveryId, []);
      byDelivery.get(loc.deliveryId)!.push(loc);
    }

    for (const [deliveryId, points] of byDelivery.entries()) {
      try {
        const delivery = await this.deliveryModel.findById(deliveryId);
        if (!delivery) {
          this.logger.warn(
            `Sync: Entrega com ID ${deliveryId} não encontrada.`,
          );
          continue;
        }
        if (!delivery.driverId) {
          this.logger.error(
            `Sync: A entrega ${deliveryId} não possui um entregador associado.`,
          );
          continue;
        }

        const deliveryDriverId =
          (delivery.driverId as any)?._id?.toString() ??
          (delivery.driverId as any)?.toString() ??
          '';

        if (String(deliveryDriverId) !== String(driverId)) {
          this.logger.error(
            `Sync: Não autorizado. Entregador ${driverId} tentando atualizar entrega ${deliveryId}`,
          );
          continue;
        }

        points.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        const toAdd: Coordinates[] = points.map((p) =>
          toGeoJSONWithTimestamp(p.lat, p.lng, new Date(p.timestamp)),
        );

        if (!delivery.routeHistory) delivery.routeHistory = [];
        delivery.routeHistory.push(...toAdd);

        const latest = points[points.length - 1];
        (delivery as any).driverCurrentLocation = toGeoJSONWithTimestamp(
          latest.lat,
          latest.lng,
          new Date(latest.timestamp),
        ) as any;

        await delivery.save();

        try {
          const geo = delivery.driverCurrentLocation as Coordinates;
          this.entregadoresGateway.emitDriverLocation(deliveryId, {
            driverId: String(deliveryDriverId),
            location: {
              type: geo.type,
              coordinates: geo.coordinates,
              timestamp: new Date(latest.timestamp).toISOString(),
            },
          });
        } catch (err) {
          this.logger.error(
            `Erro ao emitir novaLocalizacao para a entrega ${deliveryId}`,
            (err as any)?.stack,
          );
        }
      } catch (error) {
        this.logger.error(
          `Erro ao sincronizar pontos para a entrega ${deliveryId}: ${(error as any).message}`,
        );
      }
    }
  }
}

function gerarCodigoAleatorio(tamanho: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVXYZ0123456789';
  let resultado = '';
  for (let i = 0; i < tamanho; i++) {
    resultado += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return resultado;
}
