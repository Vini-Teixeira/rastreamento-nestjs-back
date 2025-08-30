import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Body,
  Param,
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
import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // use seu guard local (estende AuthGuard('jwt'))

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
  @Post('login')
  async login(@Body(new ValidationPipe()) driverLoginDto: DriverLoginDto) {
    const driver = await this.entregadoresService.validatePassword(
      driverLoginDto.telefone,
      driverLoginDto.password,
    );

    if (!driver) {
      throw new UnauthorizedException('Telefone ou senha inválidos.');
    }

    if (!driver.ativo) {
      throw new UnauthorizedException('Este entregador está inativo.');
    }

    return this.authService.loginDriver(driver);
  }

  /**
   * Atualizar localização do entregador logado
   * Protegido com JWT
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me/location')
  @HttpCode(HttpStatus.OK)
  async updateMyLocation(
    @Req() req: Request,
    @Body(new ValidationPipe()) updateLocationDto: UpdateLocationDto,
  ) {
    // Não logar token em claro; apenas verificar presença
    const authHeader = req.headers?.authorization as string | undefined;
    logger.log(`updateMyLocation called — Authorization header present: ${!!authHeader}`);

    const user = (req as any).user;
    logger.debug(`updateMyLocation -> req.user (sanitized): ${user ? JSON.stringify({ sub: user.sub }) : 'none'}`);

    if (!user || !user.sub) {
      logger.warn('updateMyLocation -> req.user ausente ou sem sub; retornando 401.');
      throw new UnauthorizedException('Token JWT inválido ou ausente.');
    }

    try {
      const updated = await this.entregadoresService.updateLocation(String(user.sub), updateLocationDto);
      logger.log(`Localização atualizada com sucesso para entregador ${user.sub}`);
      return updated;
    } catch (err) {
      // Se o service lançar NotFoundException ele será repassado; logamos para debug
      logger.error(`Erro ao atualizar localização do entregador ${user.sub}: ${err?.message ?? err}`, err?.stack);
      // Re-lança para que o Nest trate (status apropriado será enviado)
      throw err;
    }
  }

  /**
   * Rotas administrativas - protegidas com FirebaseAuthGuard
   * Apenas o painel Admin pode acessar
   */
  @UseGuards(FirebaseAuthGuard)
  @Post()
  async create(@Body(new ValidationPipe()) createEntregadorDto: CreateEntregadorDto) {
    return this.entregadoresService.create(createEntregadorDto);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get()
  async findAll() {
    return this.entregadoresService.findAll();
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const found = await this.entregadoresService.findOne(id);
    if (!found) throw new NotFoundException(`Entregador com ID ${id} não encontrado.`);
    return found;
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateEntregadorDto: UpdateEntregadorDto,
  ) {
    const updated = await this.entregadoresService.update(id, updateEntregadorDto);
    if (!updated) throw new NotFoundException(`Entregador com ID ${id} não encontrado para atualização.`);
    return updated;
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deleted = await this.entregadoresService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Entregador com ID ${id} não encontrado para remoção.`);
    }
    return { message: 'Removido com sucesso' };
  }
}
