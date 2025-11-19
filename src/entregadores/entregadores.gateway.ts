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
export class EntregadoresGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  private readonly logger = new Logger(EntregadoresGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => EntregasService))
    private readonly entregasService: EntregasService,
  ) {}

  private getTokenFromHandshake(
    client: AuthenticatedSocket,
  ): string | undefined {
    const handshake: any = client.handshake || {};
    if (handshake.auth && handshake.auth.token) {
      return String(handshake.auth.token);
    }
    if (handshake.query && handshake.query.token) {
      return String(handshake.query.token);
    }
    if (handshake.headers && handshake.headers.authorization) {
      const authHeader = String(handshake.headers.authorization);
      return authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;
    }
    return undefined;
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.getTokenFromHandshake(client);

      if (!token) {
        this.logger.warn(
          `Socket connection rejected: no token provided (socketId=${client.id})`,
        );
        client.emit('unauthorized', { message: 'Token missing' });
        client.disconnect(true);
        return;
      }

      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      } catch (err) {
        this.logger.warn(
          `Socket connection rejected: invalid token (socketId=${client.id})`,
        );
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
        this.logger.warn(
          `Não foi possível adicionar cliente à sala do driver (${payload.sub}): ${err}`,
        );
      }

      this.logger.log(
        `Socket conectado: user=${payload.sub} socketId=${client.id}`,
      );
    } catch (err) {
      this.logger.error('Unexpected error in handleConnection', err as any);
      try {
        client.disconnect(true);
      } catch {}
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const u = client.data?.user?.sub
      ? `user=${client.data.user.sub}`
      : 'Entregador: não autenticado';
    this.logger.log(`Cliente Desconectado: ${client.id} (${u})`);
  }

  @SubscribeMessage('join_delivery')
  onJoinDeliveryRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deliveryId: string },
  ): void {
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
    this.logger.log(
      `Socket ${client.id} entrou na sala da entrega ${data.deliveryId}`,
    );
  }

  @SubscribeMessage('leave_delivery')
  onLeaveDeliveryRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deliveryId: string },
  ): void {
    if (!data?.deliveryId) {
      client.emit('bad_request', { message: 'deliveryId obrigatório' });
      return;
    }
    client.leave(data.deliveryId);
    this.logger.log(
      `Socket ${client.id} saiu da sala da entrega ${data.deliveryId}`,
    );
  }

  notifyNewDelivery(driverId: string, delivery: any): void {
    try {
      this.server.to(driverId).emit('nova_entrega', delivery);
      this.logger.log(
        `Enviando notificação de nova entrega para a sala do entregador: ${driverId}`,
      );
    } catch (err) {
      this.logger.error(
        `Erro ao notificar nova entrega para driver ${driverId}`,
        err as any,
      );
    }
  }

  notifyDeliveryStatusChanged(delivery: any): void {
    try {
      const deliveryId = String(delivery._id ?? delivery.id);
      const driverId = String(
        (delivery.driverId as any)?._id ?? (delivery.driverId as any) ?? '',
      );
      const solicitanteId= String(
        (delivery.solicitanteId as any)?._id ?? (delivery.solicitanteId as any) ?? '',
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

      if(solicitanteId) {
        this.server.to(solicitanteId).emit('delivery_updated', payload)
      }

      this.logger.log(
        `Emitindo 'delivery_updated' para a sala da entrega ${deliveryId} com status ${delivery.status}`,
      );
    } catch (err) {
      this.logger.error(
        `Erro ao emitir 'delivery_updated' para a entrega ${String(delivery._id ?? delivery.id)}`,
        err as any,
      );
    }
  }

  notifySocorroStatusChanged(socorro: any): void {
    try {
      const socorroId = String(socorro._id ?? socorro.id);
      const driverId = String(
        (socorro.driverId as any)?._id ?? (socorro.driverId as any) ?? '',
      );
      const payload = {
        socorroId: socorroId,
        status: socorro.status,
        driverId: driverId,
        payload: socorro,
      };
      this.server.to(socorroId).emit('socorro_updated', payload);
      if (driverId) {
        this.server.to(driverId).emit('socorro_updated', payload);
      }
      this.logger.log(
        `Emitindo 'socorro_updated' para a sala do socorro ${socorroId} com status ${socorro.status}`,
      );
    } catch (err) {
      this.logger.error(
        `Erro ao emitir 'socorro_updated' para o socorro ${String(socorro._id ?? socorro.id)}`,
        err as any,
      );
    }
  }

  notifyStoreSelfDelivery(delivery: any): void {
    const solicitanteId = this._getSafeId(delivery.solicitanteId);
    if (!solicitanteId) {
       this.logger.error(`[notifyStoreSelfDelivery] Falha: solicitanteId não encontrado.`);
       return;
    }
    try {
      this.server.to(solicitanteId).emit('nova_notificacao_loja', {
        tipo: 'SUCCESS',
        titulo: `Entrega Criada (#${delivery.codigoEntrega})`,
        mensagem: `Sua entrega para ${delivery.destination.address} foi criada.`,
        delivery: delivery,
      });
      this.logger.log(`Notificação de Entrega Própria enviada para ${solicitanteId}`);
    } catch (err) {
      this.logger.error(`Erro ao notificar loja (própria): ${err}`);
    }
  }

  notifyStorePartnerDelivery(delivery: any): void {
    const solicitanteId = this._getSafeId(delivery.solicitanteId);
    const origemId = this._getSafeId(delivery.origemId);

    if (!origemId || !solicitanteId || solicitanteId === origemId) return;

    try {
      this.server.to(origemId).emit('nova_notificacao_loja', {
        tipo: 'INFO',
        titulo: 'Coleta de Parceira',
        mensagem: `Uma entrega (#${delivery.codigoEntrega}) solicitada por ${delivery.solicitanteId?.nomeFantasia} requer coleta. Item: ${delivery.itemDescription}`,
        delivery: delivery,
      });
      this.server.to(solicitanteId).emit('nova_notificacao_loja', {
        tipo: 'SUCCESS',
        titulo: 'Entrega Parceira Criada',
        mensagem: `Sua entrega (#${delivery.codigoEntrega}) aguarda coleta em ${delivery.origin.name}.`,
        delivery: delivery,
      });
      this.logger.log(`Notificação de Parceira enviada para ${solicitanteId} e ${origemId}`);
    } catch (err) {
      this.logger.error(`Erro ao notificar lojas (parceira): ${err}`);
    }
  }

  notifyStoreDeliveryWarning(delivery: any): void {
    try {
      const solicitanteId = this._getSafeId(delivery.solicitanteId);
      const origemId = this._getSafeId(delivery.origemId);

      const payload = {
        tipo: 'WARNING',
        titulo: `Entrega em Risco (#${delivery.codigoEntrega})`,
        mensagem: `A entrega para ${delivery.destination.address} foi recusada ${delivery.rejectionCount} vezes. Verifique o status.`,
        delivery: delivery,
      };

      if (solicitanteId) this.server.to(solicitanteId).emit('nova_notificacao_loja', payload);
      if (origemId && origemId !== solicitanteId) this.server.to(origemId).emit('nova_notificacao_loja', payload);
      
      this.logger.warn(`Notificação de AVISO (3+ recusas) enviada para a entrega ${delivery.codigoEntrega}`);
    } catch (err) {
      this.logger.error(`Erro ao notificar lojas (aviso): ${err}`);
    }
  }

  notifyStoreDeliveryUnassigned(delivery: any): void {
     try {
      const solicitanteId = this._getSafeId(delivery.solicitanteId);
      if (!solicitanteId) {
        this.logger.error(`[notifyStoreDeliveryUnassigned] Falha: solicitanteId não encontrado.`);
        return;
      }

      const payload = {
        tipo: 'ERROR',
        titulo: `Ação Necessária (#${delivery.codigoEntrega})`,
        mensagem: `Nenhum motorista foi encontrado para esta entrega. Atribua um motorista manualmente.`,
        delivery: delivery,
      };

      this.server.to(solicitanteId).emit('nova_notificacao_loja', payload);
      this.logger.error(`Notificação de NÃO ATRIBUÍDA enviada para ${solicitanteId} (Entrega ${delivery.codigoEntrega})`);
    } catch (err) {
      this.logger.error(`Erro ao notificar lojas (não atribuída): ${err}`);
    }
  }

  notifyStoreSocorroCreated (socorro: any): void {
    const solicitanteId= socorro.solicitanteId?.toString()
    if(!solicitanteId) return

    try {
      this.server.to(solicitanteId).emit('nova_notificacao_loja', {
        tipo: 'SUCCESS',
        titulo: `Entrega criada (#${socorro.codigoEntrega})`,
        mensagem: `Sua entrega para ${socorro.destination.address} foi criada!`,
        socorro: socorro
      })
      this.logger.log(`Notificação de Socorro enviada para ${solicitanteId}`)
    } catch(err) {
      this.logger.error(`Erro ao notificar loja (própria): ${err}`)
    }
  }

  emitDriverLocation(deliveryId: string, payload: any): void {
    try {
      this.server.to(deliveryId).emit('novaLocalizacao', {
        deliveryId,
        ...payload,
      });
      this.logger.log(
        `WS: novaLocalizacao emitida para sala da entrega ${deliveryId} (payload completo: ${Object.keys(payload).join(', ')})`,
      );
    } catch (err) {
      this.logger.error(
        `Erro ao emitir novaLocalizacao para entrega ${deliveryId}`,
        err as any,
      );
    }
  }

  @SubscribeMessage('atualizarLocalizacao')
  async handleLocationUpdate(
    @MessageBody() data: { deliveryId: string; lat: number; lng: number },
  ): Promise<void> {
    if (!data || !data.deliveryId) {
      this.logger.warn(
        'Gateway: Recebida atualização de localização sem dados ou deliveryId.',
      );
      return;
    }
    this.logger.log(
      `Gateway: Recebida atualização da localização para a entrega ${data.deliveryId}`,
    );
    await this.entregasService.updateDriverLocation(
      data.deliveryId,
      data.lat,
      data.lng,
    );
  }

  // Função Helper privada usada para extração segura de um ID.
  // Dessa forma, seja ele um objeto populado ou uma string,
  // a extração correta acontece (Bug de notificação)
  private _getSafeId(data: any): string | null {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (data._id) return data._id.toString();
    return null;
  }
}
