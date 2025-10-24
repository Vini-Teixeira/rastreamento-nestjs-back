import {
  Injectable,
  forwardRef,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

@Injectable()
export class SocorrosService {
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

  async create(createSocorroDto: CreateSocorroDto, lojistaId: string) {
    const clientCoordinates = await this.googleMapsService.geocodeAddress(
      createSocorroDto.clientLocation.address,
    );

    const nearestDriver = await this.entregasService.findNearestDriverInfo(
      clientCoordinates as any,
    );
    if (!nearestDriver) {
      throw new NotFoundException('Nenhum entregador disponível encontrado.');
    }

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

    const newSocorro = new this.socorroModel({
      lojistaId,
      driverId: nearestDriver._id,
      clientLocation: {
        address: createSocorroDto.clientLocation.address,
        coordinates: clientCoordinates,
      },
      serviceDescription: createSocorroDto.serviceDescription,
      codigoSocorro: codigoUnico,
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

      // Validações
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
    const socorro = await this.socorroModel.findById(socorroId).exec();
    if (!socorro) {
      throw new NotFoundException('Socorro não encontrado.');
    }

    // Validações
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
    const savedSocorro = await socorro.save();

    this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);

    return savedSocorro;
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
