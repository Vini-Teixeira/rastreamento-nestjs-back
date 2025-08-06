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
import {
  Entregador,
  EntregadorDocument,
} from '../entregadores/schemas/entregador.schema';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { EntregadoresGateway } from 'src/entregadores/entregadores.gateway';

interface GeoNearResult {
  _id: Types.ObjectId;
  distanciaCalculada: number;
}

class LocationPointDto {
  deliveryId: string;
  lat: number;
  lng: number;
  timestamp: Date
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
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const { origin, destination } = createDeliveryDto;

    const nearestDriverInfo = await this._findNearestDriverInfo(
      origin.coordinates,
    );

    if (!nearestDriverInfo) {
      this.logger.warn(
        `Nenhum entregador disponível encontrado perto das coordenadas: ${JSON.stringify(
          origin.coordinates,
        )}`,
      );
      throw new NotFoundException('Nenhum entregador disponível foi encontrado.');
    }

    const nearestDriver = await this.entregadorModel
      .findById(nearestDriverInfo._id)
      .exec();

    if (!nearestDriver) {
      throw new NotFoundException(
        `Entregador com ID ${nearestDriverInfo._id} não foi encontrado no banco.`,
      );
    }

    this.logger.log(`Entregador mais próximo encontrado: ${nearestDriver.nome}`);

    let destinationCoordinates: Coordinates;
    try {
      destinationCoordinates = await this.googleMapsService.geocodeAddress(
        destination.address,
      );
    } catch (error) {
      this.logger.error(
        `Falha no geocoding para o endereço: ${destination.address}`,
        error.stack,
      );
      throw new BadRequestException(
        'O endereço de destino não pôde ser encontrado. Por favor, verifique e tente novamente.',
      );
    }

    const newDelivery = new this.deliveryModel({
      ...createDeliveryDto,
      destination: {
        address: destination.address,
        coordinates: destinationCoordinates,
      },
      driverId: nearestDriver._id,
      status: DeliveryStatus.PENDING,
    });

    this.entregadoresGateway.notifyNewDelivery(
      nearestDriver._id.toString(),
      newDelivery,
    );
    this.logger.log(
      `Notificação de nova entrega enviada para o entregador ${nearestDriver._id}`,
    );

    return newDelivery.save();
  }

  private async _findNearestDriverInfo(
    originCoordinates: Coordinates,
  ): Promise<GeoNearResult | null> {
    const { lat, lng } = originCoordinates;

    const drivers = await this.entregadorModel.aggregate<GeoNearResult>([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'distanciaCalculada',
          query: { ativo: true, emEntrega: false },
          spherical: true,
        },
      },
      { $limit: 1 },
    ]);

    return drivers.length > 0 ? drivers[0] : null;
  }

  async findFilteredAndPaginated(
  statuses: DeliveryStatus[],
  page: number = 1,
  limit: number = 8,
): Promise<{ deliveries: Delivery[]; total: number; page: number; limit: number; }> {
  const skip = (page - 1) * limit;
  const query = (statuses && statuses.length > 0) ? { status: { $in: statuses } } : {};

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
    
    return { deliveries, total, page, limit };
  } catch (error) {
    this.logger.error('Falha ao buscar entregas paginadas', error.stack);
    return { deliveries: [], total: 0, page, limit };
  }
}

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryModel
      .findById(id)
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
    const existingDelivery = await this.deliveryModel.findById(id).exec();
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
    const result = await this.deliveryModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Entrega com ID "${id}" não encontrada para exclusão.`,
      );
    }
    return { message: 'Entrega excluída com sucesso!' };
  }

  async findAllByDriverId(driverId: string): Promise<DeliveryDocument[]> {
    return this.deliveryModel.find({ driverId }).exec();
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
    const delivery = await this.deliveryModel.findById(deliveryId).exec();
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
      deliveryId,
      driverId: updatedDelivery.driverId
        ? updatedDelivery.driverId.toString()
        : null,
      lat,
      lng,
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

  async bulkUpdateDriverLocations(
    driverId: string,
    locations: LocationPointDto[],
  ): Promise<void> {
    this.logger.log(
      `Sincronizando ${locations.length} pontos de localização para o entregador ${driverId}`,
    );
    const locationsByDelivery = new Map<string, LocationPointDto[]>();
    for (const loc of locations) {
      if (!locationsByDelivery.has(loc.deliveryId)) {
        locationsByDelivery.set(loc.deliveryId, []);
      }
      locationsByDelivery.get(loc.deliveryId)!.push(loc);
    }

    for (const [deliveryId, points] of locationsByDelivery.entries()) {
      try {
        const delivery = await this.deliveryModel.findById(deliveryId);

        if (!delivery) {
          this.logger.warn(`Sync: Entrega com ID ${deliveryId} não encontrada.`);
          continue;
        }

        if (!delivery.driverId) {
            this.logger.error(`Sync: A entrega ${deliveryId} não possui um entregador associado.`);
            continue;
        }

        if (delivery.driverId._id.toString() !== driverId) {
          this.logger.error(
            `Sync: Ação não autorizada. Entregador ${driverId} tentando atualizar entrega ${deliveryId}`,
          );
          continue;
        }

        points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const routePointsToAdd = points.map(p => ({
          lat: p.lat,
          lng: p.lng,
          timestamp: p.timestamp,
        }));

        if (!delivery.routeHistory) {
            delivery.routeHistory = [];
        }
        
        delivery.routeHistory.push(...(routePointsToAdd as Coordinates[])); 

        const latestPoint = points[points.length - 1];
        delivery.driverCurrentLocation = {
          lat: latestPoint.lat,
          lng: latestPoint.lng,
          timestamp: latestPoint.timestamp,
        } as Coordinates;

        await delivery.save();

        this.entregadoresGateway.server.to(deliveryId).emit('novaLocalizacao', {
          deliveryId,
          driverId,
          lat: latestPoint.lat,
          lng: latestPoint.lng,
          timestamp: latestPoint.timestamp.toISOString(),
        });
      } catch (error) {
        this.logger.error(
          `Erro ao sincronizar pontos para a entrega ${deliveryId}: ${error.message}`,
        );
      }
    }
  }
}
