import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { EntregasService } from '../entregas/entregas.service';
import { JwtService } from '@nestjs/jwt';
import { DeliveryDocument } from 'src/entregas/schemas/delivery.schema';

type JwtPayload = { sub: string; email?: string; [k: string]: any };
type AuthenticatedSocket = Socket & {
  user?: JwtPayload; // compatibilidade com leituras antigas
  data?: { user?: JwtPayload }; // socket.io v4 recommended
};

@WebSocketGateway({ cors: true })
export class EntregadoresGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EntregadoresGateway.name);

  constructor(
    @Inject(forwardRef(() => EntregasService))
    private entregasService: EntregasService,
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extrair token de vários locais
      let token: string | undefined;
      const handshake: any = client.handshake || {};

      if (handshake.auth && handshake.auth.token) {
        token = handshake.auth.token;
      } else if (handshake.query && handshake.query.token) {
        token = String(handshake.query.token);
      } else if (handshake.headers && handshake.headers.authorization) {
        const authHeader = String(handshake.headers.authorization);
        token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : authHeader;
      }

      if (!token) {
        this.logger.warn(
          `Socket connection rejected: no token provided (socketId=${client.id})`
        );
        // emite evento específico para cliente poder reagir
        client.emit('unauthorized', { message: 'Token missing' });
        client.disconnect(true);
        return;
      }

      // verify token de forma assíncrona
      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync(token);
      } catch (err) {
        this.logger.warn(
          `Socket connection rejected: invalid token (socketId=${client.id})`
        );
        client.emit('unauthorized', { message: 'Token invalid' });
        client.disconnect(true);
        return;
      }

      // Anexar em ambos locais para compatibilidade:
      (client as any).data = (client as any).data ?? {};
      (client as any).data.user = payload;
      (client as any).user = payload; // muitos handlers ainda leem client.user

      // Entrar na sala do driver para receber "nova_entrega"
      try {
        client.join(payload.sub);
      } catch (err) {
        this.logger.warn(
          `Não foi possível adicionar cliente à sala do driver (${payload.sub}): ${err}`
        );
      }

      this.logger.log(
        `Socket conectado: user=${payload.sub} socketId=${client.id}`
      );
    } catch (err) {
      // Catch-all para evitar uncaught exceptions que derrubem o processo
      this.logger.error('Unexpected error in handleConnection', err as any);
      try {
        client.disconnect(true);
      } catch {}
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    // ler payload do lugar seguro (data.user) com fallback para user
    const user = (client as any).data?.user ?? (client as any).user;
    const driverId = user ? user.sub : 'não autenticado';
    this.logger.log(
      `Cliente Desconectado: ${client.id} (Entregador: ${driverId})`
    );
    // cleanup adicional se necessário (ex: marcar entregador offline)
  }

  @SubscribeMessage('atualizarLocalizacao')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { deliveryId: string; lat: number; lng: number },
  ) {
    // usar data.user preferencialmente
    const user = (client as any).data?.user ?? (client as any).user;
    if (!user) {
      // caso improvável, rejeitar com erro controlado
      throw new WsException('Não autenticado');
    }
    const driverIdFromToken = user.sub;
    this.logger.log(
      `Recebendo localização do entregador ${driverIdFromToken} para a entrega ${payload.deliveryId}`,
    );

    try {
      const delivery = await this.entregasService.findOne(payload.deliveryId);

      if (!delivery) {
        throw new WsException('Entrega não encontrada');
      }

      if (!delivery.driverId || delivery.driverId._id.toString() !== driverIdFromToken) {
        throw new WsException('Ação não autorizada para esta entrega.');
      }

      await this.entregasService.updateDriverLocation(
        payload.deliveryId,
        payload.lat,
        payload.lng,
      );

      // opcional: notificar lojista/room da entrega com nova posição
      this.server.to(payload.deliveryId).emit('driver_location_updated', {
        deliveryId: payload.deliveryId,
        lat: payload.lat,
        lng: payload.lng,
        driverId: driverIdFromToken,
      });

    } catch (error: any) {
      this.logger.error(
        `Erro ao processar localização para o entregador ${driverIdFromToken}: ${error?.message ?? error}`,
      );
      client.emit('erro_localizacao', { message: error?.message ?? String(error) });
    }
  }

  notifyNewDelivery(driverId: string, delivery: DeliveryDocument) {
    this.logger.log(
      `Enviando notificação de nova entrega para a sala do entregador: ${driverId}`,
    );
    this.server.to(driverId).emit('nova_entrega', delivery);
  }

  @SubscribeMessage('joinDeliveryRoom')
  handleJoinDeliveryRoom(client: Socket, deliveryId: string) {
    client.join(deliveryId);
    this.logger.log(`Cliente ${client.id} entrou na sala da entrega: ${deliveryId}`);
  }

  @SubscribeMessage('leaveDeliveryRoom')
  handleLeaveDeliveryRoom(client: Socket, deliveryId: string) {
    client.leave(deliveryId);
    this.logger.log(`Cliente ${client.id} saiu da sala da entrega: ${deliveryId}`);
  }
}
