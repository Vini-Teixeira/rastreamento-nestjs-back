import { Controller, Post, Get, Patch, Delete, Param, Body, Query, HttpStatus, HttpCode, ValidationPipe,
  ParseFloatPipe, NotFoundException, ForbiddenException, ParseArrayPipe, DefaultValuePipe, UseGuards,
  Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { EntregasService } from './entregas.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import {
  Delivery,
  DeliveryStatus,
  Coordinates,
} from './schemas/delivery.schema';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

class SyncLocationDto {
  locations: {
    deliveryId: string;
    lat: number;
    lng: number;
    timestamp: Date;
  }[];
}

@Controller('entregas')
export class EntregasController {
  constructor(private readonly entregasService: EntregasService) {}

  @Post('localizacoes/sync')
  @UseGuards(JwtAuthGuard) 
  async syncLocations(@Body() syncLocationDto: SyncLocationDto, @Req() req) {
    const driverId = req.user.sub;
    this.entregasService.bulkUpdateDriverLocations(driverId, syncLocationDto.locations);
    return { message: 'Localizações sincronizadas com sucesso!' };
  }

  // --- ROTAS PARA ENTREGADORES (Protegidas por JWT) ---

  @Get('minhas-entregas')
  @UseGuards(AuthGuard('jwt')) 
  async findMyDeliveries(@Req() request: Request) {
    const driver = request.user as any; 
    
    if (!driver || !driver.sub) {
      throw new NotFoundException('ID do entregador não encontrado no token.');
    }
    
    return this.entregasService.findAllByDriverId(driver.sub);
  }

  @Get('detalhes/:id')
  @UseGuards(JwtAuthGuard)
  async findDeliveryDetailsForDriver(@Param('id') id: string, @Req() request: Request) {
    const delivery = await this.entregasService.findOne(id);
    if (!delivery) throw new NotFoundException(`Entrega com ID "${id}" não encontrada.`);
    
    const driver = request.user as any;
    if (!delivery.driverId) throw new UnauthorizedException('Esta entrega não está atribuída a nenhum entregador.');

    if (delivery.driverId._id.toString() !== driver.sub.toString()) {
      throw new UnauthorizedException('Você não tem permissão para ver os detalhes desta entrega.');
    }
    return delivery;
  }

  @Get('detalhes/:id/directions')
  @UseGuards(JwtAuthGuard)
  async getDeliveryDirectionsForDriver(
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const delivery = await this.entregasService.findOne(id);
    const driver = request.user as any;
    if (!delivery) throw new NotFoundException('Entrega não encontrada.');
    if (!delivery.driverId || delivery.driverId._id.toString() !== driver.sub.toString()) {
      throw new UnauthorizedException(
        'Você não tem permissão para ver a rota desta entrega.',
      );
    }

    let originCoords: Coordinates;
    let destinationCoords: Coordinates;
    if (
      delivery.status.toUpperCase() === 'ON_THE_WAY' &&
      delivery.driverCurrentLocation
    ) {
      originCoords = delivery.driverCurrentLocation;
      destinationCoords = delivery.destination.coordinates;
    } else {
      originCoords = delivery.origin.coordinates;
      destinationCoords = delivery.destination.coordinates;
    }
    const polyline = await this.entregasService.getSnappedRoutePolyline(
      originCoords,
      destinationCoords,
    );
    return { polyline };
  }

  @Patch(':id/aceitar')
  @UseGuards(JwtAuthGuard)
  async acceptDelivery(@Param('id') id: string, @Req() request: Request) {
    const delivery = await this.entregasService.findOne(id);
    const driver = request.user as any;

    if (!delivery) throw new NotFoundException('Entrega não encontrada.');
    if (!delivery.driverId || delivery.driverId._id.toString() !== driver.sub.toString()) {
      throw new UnauthorizedException(
        'Você não tem permissão para modificar esta entrega.',
      );
    }

    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new ForbiddenException(
        'Apenas entregas pendentes podem ser aceitas.',
      );
    }

    return this.entregasService.update(id, { status: DeliveryStatus.ACCEPTED });
  }

  @Patch(':id/coletar')
  @UseGuards(JwtAuthGuard)
  async collectItem(@Param('id') id: string, @Req() request: Request) {
    const delivery = await this.entregasService.findOne(id);
    const driver = request.user as any;

    if (!delivery) throw new NotFoundException('Entrega não encontrada.');
    if (!delivery.driverId || delivery.driverId._id.toString() !== driver.sub.toString()) {
      throw new UnauthorizedException(
        'Você não tem permissão para modificar esta entrega.',
      );
    }

    if (delivery.status !== DeliveryStatus.ACCEPTED) {
      throw new ForbiddenException(
        'Apenas entregas com status "accepted" podem ser coletadas.',
      );
    }

    return this.entregasService.update(id, {
      status: DeliveryStatus.ON_THE_WAY,
    });
  }

  @Patch(':id/finalizar')
  @UseGuards(JwtAuthGuard)
  async finishDelivery(@Param('id') id: string, @Req() request: Request) {
    const delivery = await this.entregasService.findOne(id);
    const driver = request.user as any;

    if (!delivery) throw new NotFoundException('Entrega não encontrada.');
    if (!delivery.driverId || delivery.driverId._id.toString() !== driver.sub.toString()){
      throw new UnauthorizedException(
        'Você não tem permissão para modificar esta entrega.',
      );
    }

    if (delivery.status !== DeliveryStatus.ON_THE_WAY) {
      throw new ForbiddenException(
        'Apenas entregas "a caminho" podem ser finalizadas.',
      );
    }

    return this.entregasService.update(id, {
      status: DeliveryStatus.DELIVERED,
    });
  }

  // --- ROTAS PARA ADMINISTRADORES (Protegidas por Firebase) ---

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe()) createDeliveryDto: CreateDeliveryDto,
  ): Promise<Delivery> {
    return this.entregasService.create(createDeliveryDto);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async findAll(
    @Query(
      'status',
      new DefaultValuePipe(''),
      new ParseArrayPipe({ separator: ',', optional: true }),
    )
    statusStrings: string[],
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 8,
  ): Promise<{
    deliveries: Delivery[];
    total: number;
    page: number;
    limit: number;
  }> {
    const statuses: DeliveryStatus[] = statusStrings
      .filter((s) =>
        Object.values(DeliveryStatus).includes(s as DeliveryStatus),
      )
      .map((s) => s as DeliveryStatus);
    return this.entregasService.findFilteredAndPaginated(statuses, page, limit);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async findOne(@Param('id') id: string): Promise<Delivery> {
    return this.entregasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateDeliveryDto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    return this.entregasService.update(id, updateDeliveryDto);
  }

  @Post(':id/route-point')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addRoutePoint(
    @Param('id') id: string,
    @Body('lat', ParseFloatPipe) lat: number,
    @Body('lng', ParseFloatPipe) lng: number,
  ): Promise<Delivery> {
    return this.entregasService.addRoutePoint(id, lat, lng);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.entregasService.delete(id);
  }

  @Patch(':id/driver-location')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateDriverLocation(
    @Param('id') id: string,
    @Body('lat', ParseFloatPipe) lat: number,
    @Body('lng', ParseFloatPipe) lng: number,
  ): Promise<Delivery> {
    return this.entregasService.updateDriverLocation(id, lat, lng);
  }

  @Get(':id/directions')
  @UseGuards(FirebaseAuthGuard)
  async getDeliveryDirections(
    @Param('id') id: string,
  ): Promise<{ polyline: string }> {
    const delivery = await this.entregasService.findOne(id);
    if (!delivery) {
      throw new NotFoundException(
        `Entrega com ID "${id}" não encontrada para gerar rota.`,
      );
    }
    let originCoords: Coordinates;
    let destinationCoords: Coordinates;
    if (
      delivery.status === DeliveryStatus.ON_THE_WAY &&
      delivery.driverCurrentLocation
    ) {
      originCoords = delivery.driverCurrentLocation;
      destinationCoords = delivery.destination.coordinates;
    } else {
      originCoords = delivery.origin.coordinates;
      destinationCoords = delivery.destination.coordinates;
    }
    const polyline = await this.entregasService.getSnappedRoutePolyline(
      originCoords,
      destinationCoords,
    );
    return { polyline };
  }
}
