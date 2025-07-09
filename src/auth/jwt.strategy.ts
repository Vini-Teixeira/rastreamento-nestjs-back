import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { EntregadoresService } from 'src/entregadores/entregadores.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly entregadoresService: EntregadoresService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('A variável de ambiente JWT_SECRET não está definida.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: string; telefone: string }) {
    const entregador = await this.entregadoresService.findOne(payload.sub);

    if (!entregador) {
      throw new UnauthorizedException('Entregador não encontrado.');
    }
    if (!entregador.ativo) {
      throw new UnauthorizedException('Entregador está inativo.');
    }

    const { password, ...result } = entregador.toObject();
    return result;
  }
}
