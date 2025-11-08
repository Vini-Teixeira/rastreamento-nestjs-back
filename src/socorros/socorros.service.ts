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
import { Model, Connection, Types } from 'mongoose';
import { Socorro, SocorroStatus } from './schemas/socorro.schema';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { EntregasService } from 'src/entregas/entregas.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';
import { CreateSocorroDto } from './dto/create-socorro.dto';
import { Entregador } from 'src/entregadores/schemas/entregador.schema';
import { ChegueiAoLocalDto } from './dto/cheguei-ao-local.dto';
import { FinalizarSocorroDto } from './dto/finalizar-socorro.dto';
import { FcmService } from 'src/fcm/fcm.service';
import { Coordinates } from 'src/entregas/schemas/delivery.schema';

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
    @Inject(forwardRef(() => EntregadoresGateway))
    private readonly entregadoresGateway: EntregadoresGateway,
    private readonly fcmService: FcmService,
  ) {}

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
    // --- FIM DA CORREÇÃO ---

    // --- Lógica Inteligente (Já está correta) ---
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
    // --- Fim da Lógica Inteligente ---

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

    const newSocorro = new this.socorroModel({
      solicitanteId: lojistaId,
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
      // --- FIM DA CORREÇÃO ---
    });

    const savedSocorro = await newSocorro.save();
    this.entregadoresGateway.notifyNewDelivery(
      nearestDriver._id.toString(),
      savedSocorro.toObject(),
    );
    if (nearestDriver.fcmToken) {
      this.fcmService.sendPushNotification(
        nearestDriver.fcmToken,
        'Novo Socorro Solicitado!',
        `Local: ${savedSocorro.clientLocation.address}`,
        { deliveryId: savedSocorro.id, type: 'socorro' },
      );
    }
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

    this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
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

    this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
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
    this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
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
      this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
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
