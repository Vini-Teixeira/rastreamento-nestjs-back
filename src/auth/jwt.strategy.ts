import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy (Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET')

    if (!jwtSecret) {
      throw new Error('A variável de ambiente JWT_SECRET não está definida.')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret
    })
  }

  async validate(payload: {sub: string; telefone: string}) {
    return { sub: payload.sub, telefone: payload.telefone }
  }
}