import { Controller, Get, Post, Put, Delete, Req, Body, Param, UseGuards, 
  ValidationPipe, Patch, UnauthorizedException } from '@nestjs/common';
import { EntregadoresService } from './entregadores.service';
import { AuthService } from 'src/auth/auth.service';
import { DriverLoginDto } from 'src/auth/dto/driver-login.dto';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';


@Controller('entregadores')
export class EntregadoresController {
  constructor(
    private readonly entregadoresService: EntregadoresService,
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body(new ValidationPipe()) driverLoginDto: DriverLoginDto) {
    const driver = await this.entregadoresService.validatePassword(
      driverLoginDto.telefone,
      driverLoginDto.password,
    );
    if (!driver) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (!driver.ativo) {
      throw new UnauthorizedException('Este entregador está inativo.');
    }
    return this.authService.loginDriver(driver);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/me/location')
  updateMyLocation(@Req() req: any, @Body() updateLocationDto: UpdateLocationDto) {
    const driverId = req.user.sub;
    return this.entregadoresService.updateLocation(driverId, updateLocationDto);
  }

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
    return this.entregadoresService.findOne(id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body(new ValidationPipe()) updateEntregadorDto: UpdateEntregadorDto) {
    return this.entregadoresService.update(id, updateEntregadorDto);
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.entregadoresService.delete(id);
  }


}