import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface DriverPayload {
  sub: string;
  telefone: string;
}

interface LojistaPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async loginDriver(driver: any) {
    if (!driver?._id || !driver?.telefone) {
      throw new UnauthorizedException(
        'Dados do entregador incompletos para geração do token.',
      );
    }

    const payload: DriverPayload = {
      sub: String(driver._id),
      telefone: String(driver.telefone),
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginLojista(lojista: any) {
    if (!lojista?._id || !lojista?.email) {
      throw new UnauthorizedException(
        'Dados do lojista incompletos para geração do token.',
      );
    }

    const payload: LojistaPayload = {
      sub: String(lojista._id),
      email: String(lojista.email),
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
