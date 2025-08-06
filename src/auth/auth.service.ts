import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async loginDriver(driver: any) {
    const payload = { sub: driver._id, telefone: driver.telefone };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginLojista(lojista: any) {
    const payload = { sub: lojista._id, email: lojista.email, type: 'lojista' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}