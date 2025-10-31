import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

const logger = new Logger('WsAuthGuard');

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    try {
      const token = client.handshake?.auth?.token || (client.handshake?.headers?.authorization || '').replace(/^Bearer\s+/i, '');
      logger.debug(`WsAuthGuard → handshake.auth.token present: ${!!token}`);
      if (!token) throw new WsException('Token ausente');

      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
      client.data = client.data || {};
      client.data.user = payload;
      logger.log(`WsAuthGuard → client ${client.id} authenticated as ${payload.sub}`);
      return true;
    } catch (err) {
      logger.warn('WsAuthGuard → auth failed', err);
      throw new WsException('Token inválido ou expirado');
    }
  }
}
