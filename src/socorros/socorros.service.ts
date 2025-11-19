import {
  Injectable,
  forwardRef,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import { Socorro, SocorroStatus } from './schemas/socorro.schema';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { EntregasService } from 'src/entregas/entregas.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';
import { CreateSocorroDto } from './dto/create-socorro.dto';
import { Entregador, EntregadorDocument } from 'src/entregadores/schemas/entregador.schema';
import { SocorroDocument } from './schemas/socorro.schema';
import { ChegueiAoLocalDto } from './dto/cheguei-ao-local.dto';
import { FinalizarSocorroDto } from './dto/finalizar-socorro.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { FcmService } from 'src/fcm/fcm.service';
import { LojistasService } from 'src/lojistas/lojistas.service';
import { Coordinates } from 'src/entregas/schemas/delivery.schema';
import { RejeicaoDto } from 'src/entregas/dto/rejeicao.dto';
import { DeliveryStatus } from 'src/entregas/enums/delivery-status.enum';
import { timestamp } from 'rxjs';

@Injectable()
export class SocorrosService {
  private readonly logger = new Logger(SocorrosService.name);

  constructor(
    @InjectModel(Socorro.name) private readonly socorroModel: Model<Socorro>,
    @InjectModel(Entregador.name)
    private readonly entregadorModel: Model<Entregador>,
    @InjectConnection() private readonly connection: Connection,
    private readonly googleMapsService: GoogleMapsService,
    private readonly entregasService: EntregasService,
    @Inject(forwardRef(() => LojistasService))
    private readonly lojistasService: LojistasService,
    @Inject(forwardRef(() => EntregadoresGateway))
    private readonly entregadoresGateway: EntregadoresGateway,
    private schedulerRegistry: SchedulerRegistry,
    private readonly fcmService: FcmService,
  ) {}

  async recusarSocorro(
    socorroId: string,
    driverId: string,
    rejeicaoDto: RejeicaoDto
  ) {
    const timeoutName = `socorro-timeout-${socorroId}`
    try {
      if(this.schedulerRegistry.doesExist('timeout', timeoutName)) {
        this.schedulerRegistry.deleteTimeout(timeoutName)
        this.logger.log(
          `Timeout para o Socorro ${socorroId} cancelado devido a recusa manual`
        )
      }
    } catch (e) {
      this.logger.warn(
        `Falha ao tentar apagar o timout ${timeoutName}. Pode já ter sido executado.`
      )
    }
    const session = await this.connection.startSession()
    session.startTransaction()

    try{
      const socorro = await this.socorroModel.findById(socorroId).session(session)
      if(!socorro) throw new NotFoundException('Socorro não encontrado')
      if(socorro.driverId?.toString() !== driverId) {
        throw new ForbiddenException('Você não pode recusar um socorro que não é seu.')
      }
      if(socorro.status !== SocorroStatus.PENDING) {
        throw new BadRequestException('Este socorro não pode mais ser recusado.')
      }
      socorro.historicoRejeicoes.push({
        ...rejeicaoDto,
        driverId: new Types.ObjectId(driverId),
        timestamp: new Date()
      })
      await socorro.save({ session })
      if(socorro.historicoRejeicoes.length >= 3) {
        this.logger.warn(
          `O socorro ${socorroId} foi recusado ${socorro.historicoRejeicoes.length} vezes. 
          Notificando Administrador e Lojista...`
        )
      }
      await this._findAndReassignSocorro(socorro, session)
      await session.commitTransaction()
      return { message: 'Socorro recusado e reatribuído com sucesso.' }
    } catch (error) {
      await session.abortTransaction()
      throw error 
    } finally {
      session.endSession()
    }
  }

  async handleSocorroTimeout(socorroId: string, driverId: string) {
  this.logger.log(`Verificando timeout para o socorro ${socorroId} do entregador ${driverId}...`);
  
  const socorro = await this.socorroModel.findById(socorroId);

  if (
    socorro &&
    socorro.status === SocorroStatus.PENDING &&
    socorro.driverId?.toString() === driverId
  ) {
    this.logger.warn(
      `Timeout! Entregador ${driverId} não respondeu. Recusa automática iniciada.`,
    );
    const rejeicaoDto: RejeicaoDto = {
      motivo: 'Recusa automática',
      texto: 'O entregador não respondeu a tempo.',
    };
    await this.recusarSocorro(socorroId, driverId, rejeicaoDto);
  } else {
    this.logger.log(
      `Timeout para ${socorroId} ignorado. Socorro já foi aceito ou recusado.`,
    );
  }
}

private async _findAndReassignSocorro(socorro: SocorroDocument, session: ClientSession) {
  const novoEntregador = await this.entregadorModel.findOne({ ativo: true });
  if (novoEntregador) {
    socorro.driverId = novoEntregador._id;
    socorro.status = SocorroStatus.PENDING;
    await socorro.save({ session });
    this.logger.log(`Socorro ${socorro.id} reatribuído para ${novoEntregador.nome}`);
  } else {
    this.logger.warn(`Nenhum entregador disponível para o socorro ${socorro.id}`);
  }
}

  async findAllBySolicitanteId(
    solicitanteId: string,
    page: number,
    limit: number,
    status?: string
  ): Promise<{ data: Socorro[]; total: number; page: number; limit: number }> {
    const query: any = { solicitanteId: new Types.ObjectId(solicitanteId) };
    if(status) {
      query.status = status
    }
    this.logger.log(
      `Buscando socorros para Lojista ${solicitanteId} com query ${JSON.stringify(query)}`,
    )
    const total = await this.socorroModel.countDocuments(query)
    const data = await this.socorroModel
    .find(query)
    .populate('driverId', 'nome telefone')
    .sort({ createdAt: -1 })
    .skip((page -1) * limit )
    .limit(limit)
    .exec()

    return {
      data,
      total,
      page,
      limit
    }
  }

  async findAllByDriverId(driverId: string): Promise<Socorro[]> {
    this.logger.log(`Buscando socorros ativos para o driverId: ${driverId}`);

    const driverObjectId = new Types.ObjectId(driverId);
    return this.socorroModel
      .find({
        driverId: driverObjectId,
        status: {
          $in: [
            SocorroStatus.PENDING,
            SocorroStatus.ACCEPTED,
            SocorroStatus.ON_THE_WAY,
            SocorroStatus.ON_SITE,
          ],
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(createSocorroDto: CreateSocorroDto, lojistaId: string) {
    this.logger.debug(
      `[CHECKLIST] DTO Recebido: ${JSON.stringify(createSocorroDto)}, solicitanteId=${lojistaId}`,
    );
    const {
      clientLocation,
      serviceDescription,
      clienteNome,
      clienteTelefone,
      placaVeiculo,
      modeloVeiculo,
    } = createSocorroDto;
    let clientCoordinates: Coordinates;
    if (clientLocation.coordinates) {
      this.logger.log(
        'Socorro: Coordenadas recebidas do frontend. Pulando geocoding.',
      );
      clientCoordinates = {
        type: 'Point',
        coordinates: [
          clientLocation.coordinates.lng,
          clientLocation.coordinates.lat,
        ],
      };
    } else {
      this.logger.warn(
        'Socorro: Coordenadas NÃO recebidas. Acionando geocoding manual (fallback)...',
      );
      try {
        clientCoordinates = await this.googleMapsService.geocodeAddress(
          clientLocation.address,
        );
        if (
          !clientCoordinates ||
          (clientCoordinates.coordinates[0] === 0 &&
            clientCoordinates.coordinates[1] === 0)
        ) {
          throw new Error(
            'Geocoding manual (Socorro) retornou coordenadas inválidas.',
          );
        }
      } catch (error) {
        this.logger.error(
          `Falha no geocoding manual (Socorro): ${error.message}`,
        );
        throw new BadRequestException(
          'O endereço do cliente (manual) não pôde ser encontrado ou é inválido.',
        );
      }
    }
    const nearestDriver = await this.entregasService.findNearestDriverInfo(
      clientCoordinates as any,
    );
    if (!nearestDriver) {
      throw new NotFoundException('Nenhum entregador disponível encontrado.');
    }
    this.logger.log(
      `Socorro: Entregador mais próximo: ${nearestDriver.nome} a ${nearestDriver.distanciaCalculada.toFixed(0)} metros.`,
    );

    let codigoUnico: string = '';
    let codigoJaExiste = true;
    while (codigoJaExiste) {
      codigoUnico = 'S-' + this.gerarCodigoAleatorio(6);
      const socorroExistente = await this.socorroModel
        .findOne({ codigoSocorro: codigoUnico })
        .exec();
      if (!socorroExistente) {
        codigoJaExiste = false;
      }
    }
    this.logger.log(`Socorro: Código único gerado: ${codigoUnico}`);

    const lojista = await this.lojistasService.findById(lojistaId)
    if(!lojista) {
      throw new NotFoundException("Lojista solicitante não encontrado")
    }

    const newSocorro = new this.socorroModel({
      solicitanteId: new Types.ObjectId(lojistaId),
      solicitanteNome: lojista.nomeFantasia,
      driverId: nearestDriver._id,
      clientLocation: {
        address: clientLocation.address,
        coordinates: clientCoordinates,
      },
      codigoSocorro: codigoUnico,
      status: 'pendente',
      clienteNome: clienteNome,
      clienteTelefone: clienteTelefone,
      placaVeiculo: placaVeiculo,
      modeloVeiculo: modeloVeiculo,
      serviceDescription: serviceDescription,
    });

    const savedSocorro = await newSocorro.save();
    this.entregadoresGateway.notifyNewDelivery(
      nearestDriver._id.toString(),
      savedSocorro.toObject(),
    );
    this.entregadoresGateway.notifySocorroStatusChanged(
      savedSocorro.toObject()
    )
    if (nearestDriver.fcmToken) {
      this.fcmService.sendPushNotification(
        nearestDriver.fcmToken,
        `Novo Socorro de ${lojista.nomeFantasia} Solicitado!`,
        `Local: ${savedSocorro.clientLocation.address}`,
        { deliveryId: savedSocorro.id, type: 'socorro', solicitanteNome: lojista.nomeFantasia },
      );
    }
    this.entregadoresGateway.notifyStoreSocorroCreated(savedSocorro.toObject())
    return savedSocorro;
  }

  async findOne(id: string) {
    const socorro = await this.socorroModel.findById(id).exec();
    if (!socorro) {
      throw new NotFoundException(`Socorro com ID ${id} não encontrado.`);
    }
    return socorro;
  }

  async acceptSocorro(socorroId: string, driverId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const socorro = await this.socorroModel
        .findById(socorroId)
        .session(session);
      if (!socorro) {
        throw new NotFoundException('Socorro não encontrado.');
      }

      if (socorro.driverId?.toString() !== driverId) {
        throw new ForbiddenException(
          'Este socorro já foi atribuído a outro entregador.',
        );
      }
      if (socorro.status !== SocorroStatus.PENDING) {
        throw new BadRequestException('Este socorro não está mais pendente.');
      }
      socorro.driverId = new Types.ObjectId(driverId);
      socorro.status = SocorroStatus.ACCEPTED;
      const socorroSavePromise = socorro.save({ session });

      const driverUpdatePromise = this.entregadorModel
        .updateOne(
          { _id: driverId },
          { $set: { emEntrega: true, recusasConsecutivas: 0 } },
          { session },
        )
        .exec();

      const [savedSocorro] = await Promise.all([
        socorroSavePromise,
        driverUpdatePromise,
      ]);
      await session.commitTransaction();

      return savedSocorro;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async iniciarDeslocamento(socorroId: string, driverId: string) {
    const socorro = await this.socorroModel.findById(socorroId).exec();
    if (!socorro) {
      throw new NotFoundException('Socorro não encontrado');
    }
    if (socorro.driverId?.toString() !== driverId) {
      throw new ForbiddenException('Este Socorro pertence a outro entregador');
    }
    if (socorro.status !== SocorroStatus.ACCEPTED) {
      throw new BadRequestException(
        'Só é possível iniciar o deslocamento de um socorro que já foi aceito por você.',
      );
    }
    socorro.status = SocorroStatus.ON_THE_WAY;
    const savedSocorro = await socorro.save();

    this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
    return savedSocorro;
  }

  async chegueiAoLocal(
    socorroId: string,
    driverId: string,
    chegueiAoLocalDto: ChegueiAoLocalDto,
  ) {
    const socorro = await this.socorroModel.findById(socorroId).exec();
    if (!socorro) {
      throw new NotFoundException('Socorro não encontrado.');
    }
    // Validações
    if (socorro.driverId?.toString() !== driverId) {
      throw new ForbiddenException('Este socorro não lhe pertence.');
    }
    if (socorro.status !== SocorroStatus.ON_THE_WAY) {
      throw new BadRequestException(
        'Apenas socorros "a caminho" podem ser marcados como "cheguei ao local".',
      );
    }
    if (
      socorro.codigoSocorro.toUpperCase() !==
        chegueiAoLocalDto.codigoSocorro.toUpperCase() &&
      !socorro.checkInLiberadoManualmente
    ) {
      throw new BadRequestException('Código de confirmação inválido.');
    }
    socorro.status = SocorroStatus.ON_SITE;
    const savedSocorro = await socorro.save();

    this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
    return savedSocorro;
  }

  async liberarCheckInManual(
    socorroId: string,
    lojistaId: string,
  ): Promise<Socorro> {
    const socorro = await this.socorroModel.findById(socorroId).exec();
    if (!socorro) {
      throw new NotFoundException(
        `Socorro com ID ${socorroId} não encontrado.`,
      );
    }
    if (socorro.solicitanteId.toString() !== lojistaId) {
      throw new ForbiddenException(
        'Você não tem permissão para modificar este socorro.',
      );
    }
    const statusPermitidos = [SocorroStatus.ACCEPTED, SocorroStatus.ON_THE_WAY];
    if (!statusPermitidos.includes(socorro.status)) {
      throw new BadRequestException(
        `Não é possível liberar o check-in para um socorro com status "${socorro.status}".`,
      );
    }
    socorro.checkInLiberadoManualmente = true;
    const savedSocorro = await socorro.save();
    this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
    return savedSocorro;
  }

  async finalizarSocorro(
    socorroId: string,
    driverId: string,
    finalizarSocorroDto: FinalizarSocorroDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const socorro = await this.socorroModel
        .findById(socorroId)
        .session(session);
      if (!socorro) {
        throw new NotFoundException('Socorro não encontrado.');
      }

      if (socorro.driverId?.toString() !== driverId) {
        throw new ForbiddenException('Este socorro não lhe pertence.');
      }
      if (socorro.status !== SocorroStatus.ON_SITE) {
        throw new BadRequestException(
          'Apenas socorros com status "no local" podem ser finalizados.',
        );
      }

      socorro.fotos = finalizarSocorroDto.fotos;
      socorro.status = SocorroStatus.COMPLETED;
      const socorroSavePromise = socorro.save({ session });
      const driverUpdatePromise = this.entregadorModel
        .updateOne(
          { _id: new Types.ObjectId(driverId) },
          { $set: { emEntrega: false } },
          { session },
        )
        .exec();
      const [savedSocorro] = await Promise.all([
        socorroSavePromise,
        driverUpdatePromise,
      ]);
      await session.commitTransaction();
      this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
      return savedSocorro;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Falha ao finalizar socorro (transação revertida): ${error.message}`,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  private gerarCodigoAleatorio(tamanho: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    for (let i = 0; i < tamanho; i++) {
      resultado += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultado;
  }
}
