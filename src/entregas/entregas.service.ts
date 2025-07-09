import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Delivery,
  DeliveryDocument,
  DeliveryStatus,
  Coordinates,
} from './schemas/delivery.schema';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { EntregadoresService } from '../entregadores/entregadores.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';

@Injectable()
export class EntregasService {
  private readonly logger = new Logger(EntregasService.name);

  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    private entregadoresService: EntregadoresService,
    private googleMapsService: GoogleMapsService,
    @Inject(forwardRef(() => EntregadoresGateway))
    private entregadoresGateway: EntregadoresGateway,
  ) {}


  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const destinationAddress = createDeliveryDto.destination.address;
    let destinationCoordinates;

    try {
      destinationCoordinates = await this.googleMapsService.geocodeAddress(
        destinationAddress,
      );
    } catch (error) {
      this.logger.error(`Falha no geocoding para o endereço: ${destinationAddress}`, error);
      throw new BadRequestException(
        'O endereço de destino não pôde ser encontrado. Por favor, verifique e tente novamente.',
      );
    }

    const newDelivery = new this.deliveryModel({
      ...createDeliveryDto,
      destination: {
        address: destinationAddress,
        coordinates: destinationCoordinates,
      },
      status: DeliveryStatus.PENDING,
    });

    const entregadores = await this.entregadoresService.findAll();
    if (entregadores.length > 0) {
      newDelivery.driverId = entregadores[0]._id as Types.ObjectId;
    } else {
      this.logger.warn('Nenhum entregador disponível para a nova entrega.');
    }

    return newDelivery.save();
  }

  async findFilteredAndPaginated(
    statuses: DeliveryStatus[] = Object.values(DeliveryStatus),
    page: number = 1,
    limit: number = 8,
  ): Promise<{
    deliveries: Delivery[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (statuses && statuses.length > 0) {
      query.status = { $in: statuses };
    }

    const [deliveries, total] = await Promise.all([
      this.deliveryModel
        .find(query)
        .populate('driverId')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.deliveryModel.countDocuments(query).exec(),
    ]);

    return { deliveries, total, page, limit };
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryModel
      .findById(id as string)
      .populate('driverId')
      .exec();
    if (!delivery) {
      throw new NotFoundException(`Entrega com ID "${id}" não encontrada.`);
    }
    return delivery;
  }

  async update(
    id: string,
    updateDeliveryDto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    const existingDelivery = await this.deliveryModel
      .findById(id as string)
      .exec();
    if (!existingDelivery) {
      throw new NotFoundException(
        `Entrega com ID "${id}" não encontrada para atualização.`,
      );
    }

    if (updateDeliveryDto.status) {
      existingDelivery.status = updateDeliveryDto.status;
    }
    if (updateDeliveryDto.driverId) {
      existingDelivery.driverId = new Types.ObjectId(
        updateDeliveryDto.driverId,
      );
    }
    if (updateDeliveryDto.itemDescription) {
      existingDelivery.itemDescription = updateDeliveryDto.itemDescription;
    }

    if (updateDeliveryDto.routeHistory) {
      existingDelivery.routeHistory = updateDeliveryDto.routeHistory.map(
        (coordDto) => ({
          lat: coordDto.lat,
          lng: coordDto.lng,
          timestamp: coordDto.timestamp ?? new Date(),
        }),
      ) as any;
    }

    if (updateDeliveryDto.driverCurrentLocation) {
      existingDelivery.driverCurrentLocation = {
        lat: updateDeliveryDto.driverCurrentLocation.lat,
        lng: updateDeliveryDto.driverCurrentLocation.lng,
        timestamp: updateDeliveryDto.driverCurrentLocation.timestamp ?? new Date(),
      } as any;
    }

    return existingDelivery.save();
  }

  async delete(id: string): Promise<any> {
    const result = await this.deliveryModel
      .deleteOne({ _id: id as string })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Entrega com ID "${id}" não encontrada para exclusão.`,
      );
    }
    return { message: 'Entrega excluída com sucesso!' };
  }

  async findAllByDriverId(driverId: string): Promise<DeliveryDocument[]> {
    return this.deliveryModel.find({ driverId: driverId }).exec();
  }

  async addRoutePoint(
    deliveryId: string,
    lat: number,
    lng: number,
  ): Promise<Delivery> {
    const delivery = await this.deliveryModel.findById(deliveryId as string).exec();
    if (!delivery) {
      throw new NotFoundException(
        `Entrega com ID "${deliveryId}" não encontrada para adicionar ponto de rota.`,
      );
    }

    if (!delivery.routeHistory) {
      delivery.routeHistory = [];
    }
    delivery.routeHistory.push({ lat, lng, timestamp: new Date() } as Coordinates);
    return delivery.save();
  }

  async updateDriverLocation(
    deliveryId: string,
    lat: number,
    lng: number,
  ): Promise<Delivery> {
    const delivery = await this.deliveryModel.findById(deliveryId as string).exec();
    if (!delivery) {
      throw new NotFoundException(
        `Entrega com ID "${deliveryId}" não encontrada para atualizar localização do entregador.`,
      );
    }

    delivery.driverCurrentLocation = {
      lat,
      lng,
      timestamp: new Date(),
    } as Coordinates;
    const updatedDelivery = await delivery.save();

    this.entregadoresGateway.server.to(deliveryId).emit('novaLocalizacao', {
      deliveryId: deliveryId,
      driverId: updatedDelivery.driverId
        ? updatedDelivery.driverId.toString()
        : null,
      lat: lat,
      lng: lng,
      timestamp: updatedDelivery.driverCurrentLocation?.timestamp?.toISOString(),
    });
    this.logger.log(
      `WS Service: Localização da entrega ${deliveryId} transmitida para sala: ${lat}, ${lng}`,
    );

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
}
