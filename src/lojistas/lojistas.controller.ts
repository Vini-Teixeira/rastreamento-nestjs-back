import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  Get,
  Req,
  Delete,
  UnauthorizedException,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { LojistasService } from './lojistas.service';
import { AuthService } from '../auth/auth.service';
import { LojistaLoginDto } from '../auth/dto/lojista-login.dto';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { UpdateLojistaDto } from './dto/update-lojista.dto';
import { AdminAuthGuard } from 'src/auth/guards/admin-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthenticatedUser } from 'src/types/authenticated-user.type';

@Controller('lojistas')
export class LojistasController {
  constructor(
    private readonly lojistasService: LojistasService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(AdminAuthGuard)
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.lojistasService.findAll({ page, limit });
  }

  @Post('login')
  async login(@Body(new ValidationPipe()) lojistaLoginDto: LojistaLoginDto) {
    const lojista = await this.lojistasService.validatePassword(
      lojistaLoginDto.email,
      lojistaLoginDto.password,
    );
    if (!lojista) {
      throw new UnauthorizedException('Credenciais de lojista inválidas.');
    }
    return this.authService.loginLojista(lojista);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe()) createLojistaDto: CreateLojistaDto,
  ) {
    return this.lojistasService.create(createLojistaDto);
  }

  @Put(':id')
  @UseGuards(AdminAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateLojistaDto: UpdateLojistaDto,
  ) {
    const updated = await this.lojistasService.update(id, updateLojistaDto);
    if (!updated) {
      throw new NotFoundException(`Lojista com ID ${id} não encontrado.`);
    }
    return updated;
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async delete(@Param('id') id: string) {
    const deleted = await this.lojistasService.delete(id)
    if(!deleted) {
      throw new NotFoundException(`Lojista com ID ${id} não encontrado para remoção.`)
    }
    return { message: 'Loja removida com sucesso.' }
  }

  @Get('me/dashboard-summary')
  @UseGuards(JwtAuthGuard)
  async getDashboardSummary(@Req() request: { user: AuthenticatedUser }) {
    const solicitanteId = request.user.sub;
    return this.lojistasService.getDashboardSummary(solicitanteId);
  }

  @Get('para-selecao')
  @UseGuards(JwtAuthGuard)
  async findAllForSelection() {
    return this.lojistasService.findAllForSelection()
  }
}
