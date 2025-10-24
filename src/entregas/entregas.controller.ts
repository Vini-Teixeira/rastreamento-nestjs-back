import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  ParseFloatPipe,
  NotFoundException,
  ForbiddenException,
  UseGuards,
  Req,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
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
import { FlexibleAuthGuard } from 'src/auth/flexible-auth.guard';
import { RejeicaoDto } from './dto/rejeicao.dto';
import { InstalandoDto } from './dto/instalando.dto';

const logger = new Logger('EntregasController');

class SyncLocationDto {
  locations: {
    deliveryId: string;
    lat: number;
    lng: number;
    timestamp: Date;
  }[];
}

interface AuthenticatedUser {
  sub: string;
  email?: string;
  telefone?: string;
  role: string;
}

@Controller('entregas')
@UseGuards(FlexibleAuthGuard)
export class EntregasController {
  constructor(private readonly entregasService: EntregasService) {}

  @Post('localizacoes/sync')
  async syncLocations(
    @Body() syncLocationDto: SyncLocationDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    logger.debug(
      `Handler syncLocations → req.user: ${
        user ? JSON.stringify({ sub: user.sub }) : 'none'
      }`,
    );

    if (!user?.sub) {
      throw new UnauthorizedException('Token inválido ou ausente');
    }

    if (
      !syncLocationDto?.locations ||
      !Array.isArray(syncLocationDto.locations)
    ) {
      throw new BadRequestException('Payload de localizações inválido');
    }

    await this.entregasService.bulkUpdateDriverLocations(
      user.sub,
      syncLocationDto.locations,
    );
    return { success: true };
  }

  @Get('minhas-entregas')
  async findMyDeliveries(@Req() request: Request) {
    const driver = request.user as any;

    if (!driver || !driver.sub) {
      throw new NotFoundException('ID do entregador não encontrado no token.');
    }

    return this.entregasService.findAllByDriverId(driver.sub);
  }

  @Get('detalhes/:id')
  async findDeliveryDetailsForDriver(
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const delivery = await this.entregasService.findOne(id);
    if (!delivery) {
      throw new NotFoundException(`Entrega com ID "${id}" não encontrada.`);
    }

    const driver = request.user as any;
    if (!delivery.driverId) {
      throw new UnauthorizedException(
        'Esta entrega não está atribuída a nenhum entregador.',
      );
    }

    const assigned =
      (delivery.driverId as any)?._id?.toString() ??
      (delivery.driverId as any)?.toString() ??
      null;

    if (assigned !== driver.sub.toString()) {
      throw new UnauthorizedException(
        'Você não tem permissão para ver os detalhes desta entrega.',
      );
    }
    return delivery;
  }

  @Get('detalhes/:id/directions')
  async getDeliveryDirectionsForDriver(
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const delivery = await this.entregasService.findOne(id);
    const driver = request.user as any;
    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada.');
    }

    const assigned =
      (delivery.driverId as any)?._id?.toString() ??
      (delivery.driverId as any)?.toString() ??
      null;

    if (!assigned || assigned !== driver.sub.toString()) {
      throw new UnauthorizedException(
        'Você não tem permissão para ver a rota desta entrega.',
      );
    }

    let originCoords: Coordinates;
    let destinationCoords: Coordinates;
    if (
      delivery.status === DeliveryStatus.A_CAMINHO &&
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

  @Post(':id/recusar')
  @UseGuards(JwtAuthGuard)
  async recusarEntrega(
    @Param('id') deliveryId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() rejeicaoDto: RejeicaoDto,
  ) {
    const driverId = request.user.sub;
    return this.entregasService.recusarEntrega(
      deliveryId,
      driverId,
      rejeicaoDto,
    );
  }

  @Patch(':id/aceitar')
  async acceptDelivery(@Param('id') id: string, @Req() request: Request) {
    const driver = request.user as any;

    if (!driver || !driver.sub) {
      throw new NotFoundException('ID do entregador não encontrado no token.');
    }

    return this.entregasService.acceptDelivery(id, driver.sub);
  }

  @Patch(':id/coletar')
  async collectItem(@Param('id') id: string, @Req() request: Request) {
    const driver = request.user as any;
    return this.entregasService.collectItem(id, driver.sub);
  }

  @Patch(':id/liberar-checkin')
  @UseGuards(JwtAuthGuard)
  async liberarCheckIn(
    @Param('id') deliveryId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const lojistaId = request.user.sub;
    return this.entregasService.liberarCheckInManual(deliveryId, lojistaId);
  }

  @Post(':id/instalando')
  @UseGuards(JwtAuthGuard)
  async realizarInstalacao(
    @Param('id') deliveryId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() instalandoDto: InstalandoDto,
  ) {
    const driverId = request.user.sub
    return this.entregasService.realizarCheckIn(deliveryId, driverId, instalandoDto)
  }

  @Patch(':id/finalizar')
  @UseGuards(JwtAuthGuard)
  async finishDelivery(@Param('id') id: string, @Req() request: Request) {
    const driver = request.user as any;
    return this.entregasService.finishDelivery(id, driver.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe()) createDeliveryDto: CreateDeliveryDto,
    @Req() req: { user: AuthenticatedUser },
  ): Promise<Delivery> {
    const lojistaId = req.user.sub;
    return this.entregasService.create(createDeliveryDto, lojistaId);
  }

  @Get()
  async findAll(
    @Req() req: { user: AuthenticatedUser },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 8,
    @Query('status') status?: string,
  ) {
    const user = req.user;

    if (user.role === 'admin') {
      return this.entregasService.findAll({ page, limit, status });
    } else {
      const lojistaId = user.sub;
      return this.entregasService.findAllBySolicitanteId(
        lojistaId,
        page,
        limit,
        status,
      );
    }
  }

  @Get()
  async findAllByLojista(
    @Req() req: { user: AuthenticatedUser },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 8,
  ) {
    const lojistaId = req.user.sub;
    return this.entregasService.findAllBySolicitanteId(lojistaId, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Delivery> {
    return this.entregasService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateDeliveryDto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    return this.entregasService.update(id, updateDeliveryDto);
  }

  @Post(':id/route-point')
  @HttpCode(HttpStatus.OK)
  async addRoutePoint(
    @Param('id') id: string,
    @Body('lat', ParseFloatPipe) lat: number,
    @Body('lng', ParseFloatPipe) lng: number,
  ): Promise<Delivery> {
    return this.entregasService.addRoutePoint(id, lat, lng);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.entregasService.delete(id);
  }

  @Patch(':id/driver-location')
  @HttpCode(HttpStatus.OK)
  async updateDriverLocation(
    @Param('id') id: string,
    @Body('lat', ParseFloatPipe) lat: number,
    @Body('lng', ParseFloatPipe) lng: number,
  ): Promise<Delivery> {
    return this.entregasService.updateDriverLocation(id, lat, lng);
  }

  @Get(':id/directions')
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
      delivery.status === DeliveryStatus.A_CAMINHO &&
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
