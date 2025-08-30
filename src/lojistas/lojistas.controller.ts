import { Controller, Post, Body, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { LojistasService } from './lojistas.service';
import { AuthService } from '../auth/auth.service';
import { LojistaLoginDto } from '../auth/dto/lojista-login.dto';

@Controller('lojistas')
export class LojistasController {
  constructor(
    private readonly lojistasService: LojistasService,
    private readonly authService: AuthService,
  ) {}

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

}