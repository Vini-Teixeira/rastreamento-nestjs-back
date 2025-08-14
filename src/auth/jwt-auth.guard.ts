import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const logger = new Logger('JwtAuthGuard');

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    logger.debug(`handleRequest → user: ${user ? JSON.stringify({ sub: user.sub }) : 'none'}, info: ${info?.message ?? info}`);
    if (err) {
      logger.error('JwtAuthGuard encountered error', err);
      throw err;
    }
    if (!user) {
      logger.warn('JwtAuthGuard: no user found — throwing UnauthorizedException');
      throw new UnauthorizedException('Token inválido ou ausente');
    }
    return user;
  }
}
