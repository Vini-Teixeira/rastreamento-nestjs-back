import { Controller, Post, Body, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DriverLoginDto } from './dto/driver-login.dto';
import { LojistaLoginDto } from './dto/lojista-login.dto';
import { CreateLojistaDto } from 'src/lojistas/dto/create-lojista.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('driver/login')
  async driverLogin(@Body(new ValidationPipe()) driverLoginDto: DriverLoginDto) {
    const driver = await this.authService.validateDriver(
      driverLoginDto.telefone,
      driverLoginDto.password,
    );

    if (!driver) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    
    if (!driver.ativo) {
        throw new UnauthorizedException('Este entregador está inativo e não pode fazer login.');
    }

    return this.authService.loginDriver(driver);
  }

  @Post('lojista/register')
  async registerLojista(@Body(new ValidationPipe()) createLojistaDto: CreateLojistaDto) {
    // A lógica de verificação de email duplicado está no serviço
    return this.authService.registerLojista(createLojistaDto);
  }

  @Post('lojista/login')
  async lojistaLogin(@Body(new ValidationPipe()) lojistaLoginDto: LojistaLoginDto) {
    const lojista = await this.authService.validateLojista(
      lojistaLoginDto.email,
      lojistaLoginDto.password,
    );
    if (!lojista) {
      throw new UnauthorizedException('Credenciais de lojista inválidas.');
    }
    return this.authService.loginLojista(lojista);
  }
}
