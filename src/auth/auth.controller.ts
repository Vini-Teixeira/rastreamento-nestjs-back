import { Controller, Post, Body, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LojistasService } from 'src/lojistas/lojistas.service';
import { DriverLoginDto } from './dto/driver-login.dto';
import { LojistaLoginDto } from './dto/lojista-login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly lojistasService: LojistasService,
  ) {}

  @Post('lojista/login')
  async lojistaLogin(@Body(new ValidationPipe()) lojistaLoginDto: LojistaLoginDto) {
    const lojista = await this.lojistasService.validatePassword(
      lojistaLoginDto.email,
      lojistaLoginDto.password,
    );
    if (!lojista) {
      throw new UnauthorizedException('Credenciais de lojista inválidas.');
    }
    return this.authService.loginLojista(lojista);
  }
}