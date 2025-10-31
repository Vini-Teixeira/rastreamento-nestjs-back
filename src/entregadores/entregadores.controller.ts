import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  Patch,
  UnauthorizedException,
  Logger,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { EntregadoresService } from './entregadores.service';
import { AuthService } from 'src/auth/auth.service';
import { DriverLoginDto } from 'src/auth/dto/driver-login.dto';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminAuthGuard } from 'src/auth/guards/admin-auth.guard';
import { AuthenticatedUser } from 'src/types/authenticated-user.type';
import { Job } from './interfaces/job.interface';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';

const logger = new Logger('EntregadoresController');

@Controller('entregadores')
export class EntregadoresController {
  constructor(
    private readonly entregadoresService: EntregadoresService,
    private readonly authService: AuthService,
  ) {}

  /**
   * LOGIN - Apenas para entregadores
   * Retorna JWT para uso nas rotas protegidas com JwtAuthGuard
   */
  @Patch('me/heartbeat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async heartbeat(@Req() request: { user: AuthenticatedUser }) {
    const driverId = request.user.sub;
    await this.entregadoresService.updateHeartbeat(driverId);
  }

  @Post('login')
  async login(@Body(new ValidationPipe()) driverLoginDto: DriverLoginDto) {
    const driver = await this.entregadoresService.validatePassword(
      driverLoginDto.telefone,
      driverLoginDto.password,
    );

    if (!driver) {
      throw new UnauthorizedException('Telefone ou senha inválidos.');
    }
    await this.entregadoresService.markAsActive(driver._id.toString());
    driver.ativo = true;
    return this.authService.loginDriver(driver);
  }

  @Patch('me/logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: { user: AuthenticatedUser }) {
    const driverId = request.user.sub
    await this.entregadoresService.registerLogout(driverId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/location')
  @HttpCode(HttpStatus.OK)
  async updateMyLocation(
    @Req() req: Request,
    @Body(new ValidationPipe()) updateLocationDto: UpdateLocationDto,
  ) {
    const authHeader = req.headers?.authorization as string | undefined;
    logger.log(
      `updateMyLocation called — Authorization header present: ${!!authHeader}`,
    );

    const user = (req as any).user;
    logger.debug(
      `updateMyLocation -> req.user (sanitized): ${user ? JSON.stringify({ sub: user.sub }) : 'none'}`,
    );

    if (!user || !user.sub) {
      logger.warn(
        'updateMyLocation -> req.user ausente ou sem sub; retornando 401.',
      );
      throw new UnauthorizedException('Token JWT inválido ou ausente.');
    }

    try {
      const updated = await this.entregadoresService.updateLocation(
        String(user.sub),
        updateLocationDto,
      );
      logger.log(
        `Localização atualizada com sucesso para entregador ${user.sub}`,
      );
      return updated;
    } catch (err) {
      logger.error(
        `Erro ao atualizar localização do entregador ${user.sub}: ${err?.message ?? err}`,
        err?.stack,
      );
      throw err;
    }
  }

  @Get('meus-trabalhos')
  @UseGuards(JwtAuthGuard)
  async getMyJobs(@Req() request: { user: AuthenticatedUser }): Promise<Job[]> {
    const driverId = request.user.sub;
    return this.entregadoresService.findMyJobs(driverId);
  }

  /**
   * Rotas administrativas - protegidas com FirebaseAuthGuard
   * Apenas o painel Admin pode acessar
   */
  @Get()
  @UseGuards(AdminAuthGuard)
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.entregadoresService.findAll({ page, limit });
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  async create(
    @Body(new ValidationPipe()) createEntregadorDto: CreateEntregadorDto,
  ) {
    return this.entregadoresService.create(createEntregadorDto);
  }

  @UseGuards(AdminAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const found = await this.entregadoresService.findOne(id);
    if (!found)
      throw new NotFoundException(`Entregador com ID ${id} não encontrado.`);
    return found;
  }

  @UseGuards(AdminAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateEntregadorDto: UpdateEntregadorDto,
  ) {
    const updated = await this.entregadoresService.update(
      id,
      updateEntregadorDto,
    );
    if (!updated)
      throw new NotFoundException(
        `Entregador com ID ${id} não encontrado para atualização.`,
      );
    return updated;
  }

  @UseGuards(AdminAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deleted = await this.entregadoresService.delete(id);
    if (!deleted) {
      throw new NotFoundException(
        `Entregador com ID ${id} não encontrado para remoção.`,
      );
    }
    return { message: 'Removido com sucesso' };
  }

  @Patch('me/fcm-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateFcmToken(
    @Req() request: { user: AuthenticatedUser },
    @Body() updateFcmTokenDto: UpdateFcmTokenDto,
  ) {
    const driverId = request.user.sub
    await this.entregadoresService.updateFcmToken(driverId, updateFcmTokenDto.fcmToken);
  }
}
