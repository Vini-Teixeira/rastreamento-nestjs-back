import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { EntregasService } from 'src/entregas/entregas.service';

export interface JwtPayload {
  sub: string;
  telefone?: string;
  iat?: number;
  exp?: number;
}

export type AuthenticatedSocket = Socket & {
  user?: JwtPayload;
  data?: { user?: JwtPayload };
};

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['authorization', 'content-type'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  namespace: '/',
})
@Injectable()
export class EntregadoresGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: Server;

  private readonly logger = new Logger(EntregadoresGateway.name);

  constructor(private readonly jwtService: JwtService,
    @Inject(forwardRef(() => EntregasService))
    private readonly entregasService: EntregasService
  ) {}

  private getTokenFromHandshake(client: AuthenticatedSocket): string | undefined {
    const handshake: any = client.handshake || {};
    if (handshake.auth && handshake.auth.token) {
      return String(handshake.auth.token);
    }
    if (handshake.query && handshake.query.token) {
      return String(handshake.query.token);
    }
    if (handshake.headers && handshake.headers.authorization) {
      const authHeader = String(handshake.headers.authorization);
      return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }
    return undefined;
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.getTokenFromHandshake(client);

      if (!token) {
        this.logger.warn(`Socket connection rejected: no token provided (socketId=${client.id})`);
        client.emit('unauthorized', { message: 'Token missing' });
        client.disconnect(true);
        return;
      }

      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      } catch (err) {
        this.logger.warn(`Socket connection rejected: invalid token (socketId=${client.id})`);
        client.emit('unauthorized', { message: 'Token invalid' });
        client.disconnect(true);
        return;
      }

      client.data = client.data ?? {};
      client.data.user = payload;
      (client as any).user = payload;

      try {
        client.join(payload.sub);
      } catch (err) {
        this.logger.warn(`Não foi possível adicionar cliente à sala do driver (${payload.sub}): ${err}`);
      }

      this.logger.log(`Socket conectado: user=${payload.sub} socketId=${client.id}`);
    } catch (err) {
      this.logger.error('Unexpected error in handleConnection', err as any);
      try {
        client.disconnect(true);
      } catch {}
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const u = client.data?.user?.sub ? `user=${client.data.user.sub}` : 'Entregador: não autenticado';
    this.logger.log(`Cliente Desconectado: ${client.id} (${u})`);
  }

  @SubscribeMessage('join_delivery')
  onJoinDeliveryRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { deliveryId: string }): void {
    const user = client.data?.user;
    if (!user?.sub) {
      client.emit('unauthorized', { message: 'Token invalid or missing' });
      client.disconnect(true);
      return;
    }
    if (!data?.deliveryId) {
      client.emit('bad_request', { message: 'deliveryId obrigatório' });
      return;
    }
    client.join(data.deliveryId);
    this.logger.log(`Socket ${client.id} entrou na sala da entrega ${data.deliveryId}`);
  }

  @SubscribeMessage('leave_delivery')
  onLeaveDeliveryRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { deliveryId: string }): void {
    if (!data?.deliveryId) {
      client.emit('bad_request', { message: 'deliveryId obrigatório' });
      return;
    }
    client.leave(data.deliveryId);
    this.logger.log(`Socket ${client.id} saiu da sala da entrega ${data.deliveryId}`);
  }

  notifyNewDelivery(driverId: string, delivery: any): void {
    try {
      this.server.to(driverId).emit('nova_entrega', delivery);
      this.logger.log(`Enviando notificação de nova entrega para a sala do entregador: ${driverId}`);
    } catch (err) {
      this.logger.error(`Erro ao notificar nova entrega para driver ${driverId}`, err as any);
    }
  }

  notifyDeliveryStatusChanged(delivery: any): void {
  try {
    const deliveryId = String(delivery._id ?? delivery.id);
    const driverId = String(
      (delivery.driverId as any)?._id ?? (delivery.driverId as any) ?? ''
    );
    const storeId = String(
      (delivery.loja as any)?._id ?? (delivery.loja as any) ?? ''
    );

    const payload = {
      deliveryId: deliveryId,
      status: delivery.status,
      driverId: driverId,
      payload: delivery,
    };

    this.server.to(deliveryId).emit('delivery_updated', payload);

    if (driverId) {
      this.server.to(driverId).emit('delivery_updated', payload);
    }

    // 5. (Futuro) Quando o painel do lojista precisar de updates, podemos adicionar:
    //    if (storeId) {
    //      this.server.to(storeId).emit('delivery_updated', payload);
    //    }

    this.logger.log(
      `Emitindo 'delivery_updated' para a sala da entrega ${deliveryId} com status ${delivery.status}`
    );
  } catch (err) {
    this.logger.error(
      `Erro ao emitir 'delivery_updated' para a entrega ${String(delivery._id ?? delivery.id)}`,
      err as any
    );
  }
}

  emitDriverLocation(deliveryId: string, payload: any): void {
  try {
    this.server.to(deliveryId).emit('novaLocalizacao', {
      deliveryId,
      ...payload,
    });
    this.logger.log(
      `WS: novaLocalizacao emitida para sala da entrega ${deliveryId} (payload completo: ${Object.keys(payload).join(', ')})`
    );
  } catch (err) {
    this.logger.error(
      `Erro ao emitir novaLocalizacao para entrega ${deliveryId}`,
      err as any
    );
  }
}


  @SubscribeMessage('atualizarLocalizacao')
  async handleLocationUpdate(
    @MessageBody() data : { deliveryId: string, lat: number, lng: number },
  ): Promise<void> {
    if(!data || !data.deliveryId) {
      this.logger.warn('Gateway: Recebida atualização de localização sem dados ou deliveryId.')
      return
    }
    this.logger.log(`Gateway: Recebida atualização da localização para a entrega ${data.deliveryId}`)
    await this.entregasService.updateDriverLocation(
      data.deliveryId,
      data.lat,
      data.lng
    )
  }
}
