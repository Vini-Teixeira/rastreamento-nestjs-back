import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    console.log('✅ JWT Payload recebido no JwtStrategy.validate():', payload);

    return {
      sub: payload.sub,
      telefone: payload.telefone ?? null,
      email: payload.email ?? null,
      role: payload.role,
    };
  }
}
