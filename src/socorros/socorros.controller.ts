import {
  Controller,
  Post,
  Patch,
  Body,
  Req,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SocorrosService } from './socorros.service';
import { CreateSocorroDto } from './dto/create-socorro.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthenticatedUser } from 'src/types/authenticated-user.type';
import { ChegueiAoLocalDto } from './dto/cheguei-ao-local.dto';
import { FinalizarSocorroDto } from './dto/finalizar-socorro.dto';

@Controller('socorros')
@UseGuards(JwtAuthGuard)
export class SocorrosController {
  constructor(private readonly socorrosService: SocorrosService) {}

  @Post()
  async create(
    @Body() createSocorroDto: CreateSocorroDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const solicitanteId = request.user.sub;
    return this.socorrosService.create(createSocorroDto, solicitanteId);
  }

  @Get('meus-socorros')
  async findMySocorros(@Req() request: { user: AuthenticatedUser }) {
    const driverId = request.user.sub;
    return this.socorrosService.findAllByDriverId(driverId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.socorrosService.findOne(id);
  }

  @Patch(':id/aceitar')
  async accept(
    @Param('id') socorroId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const driverId = request.user.sub;
    return this.socorrosService.acceptSocorro(socorroId, driverId);
  }

  @Patch(':id/iniciar-deslocamento')
  async iniciarDeslocamento(
    @Param('id') socorroId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const driverId = request.user.sub;
    return this.socorrosService.iniciarDeslocamento(socorroId, driverId);
  }

  @Patch(':id/cheguei-ao-local')
  async chegueiAoLocal(
    @Param('id') socorroId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() chegueiAoLocalDto: ChegueiAoLocalDto,
  ) {
    const driverId = request.user.sub;
    return this.socorrosService.chegueiAoLocal(
      socorroId,
      driverId,
      chegueiAoLocalDto,
    );
  }

  @Patch(':id/liberar-checkin')
  async liberarCheckIn(
    @Param('id') socorroId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const solicitanteId = request.user.sub;
    return this.socorrosService.liberarCheckInManual(socorroId, solicitanteId);
  }

  @Patch(':id/finalizar')
  async finalizarSocorro(
    @Param('id') socorroId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() finalizarSocorroDto: FinalizarSocorroDto,
  ) {
    const driverId = request.user.sub;
    return this.socorrosService.finalizarSocorro(
      socorroId,
      driverId,
      finalizarSocorroDto,
    );
  }
}
