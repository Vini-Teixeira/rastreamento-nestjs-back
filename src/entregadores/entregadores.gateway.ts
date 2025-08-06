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
import { Logger, Inject, forwardRef, UseGuards } from '@nestjs/common';
import { EntregasService } from '../entregas/entregas.service';
import { WsAuthGuard } from 'src/auth/guards/ws-auth.guard';
import { DeliveryDocument } from 'src/entregas/schemas/delivery.schema';

type AuthenticatedSocket = Socket & { user: { sub: string; email: string } };

@UseGuards(WsAuthGuard)
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
  ) {}

  handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    const driverId = client.user.sub;
    client.join(driverId);
    this.logger.log(
      `Cliente Conectado: ${client.id} (Entregador: ${driverId})`,
    );
    client.emit('connectionSuccess', { message: 'Conectado com sucesso!' });
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    const driverId = client.user ? client.user.sub : 'não autenticado';
    this.logger.log(
      `Cliente Desconectado: ${client.id} (Entregador: ${driverId})`,
    );
  }

  @SubscribeMessage('atualizarLocalizacao')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { deliveryId: string; lat: number; lng: number },
  ) {
    const driverIdFromToken = client.user.sub;
    this.logger.log(
      `Recebendo localização do entregador ${driverIdFromToken} para a entrega ${payload.deliveryId}`,
    );

    try {
      const delivery = await this.entregasService.findOne(payload.deliveryId);
      
      // ✅ 4. Adicionamos a verificação para garantir que delivery.driverId existe.
      if (!delivery.driverId || delivery.driverId._id.toString() !== driverIdFromToken) {
        throw new WsException('Ação não autorizada para esta entrega.');
      }

      await this.entregasService.updateDriverLocation(
        payload.deliveryId,
        payload.lat,
        payload.lng,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar localização para o entregador ${driverIdFromToken}: ${error.message}`,
      );
      client.emit('erro_localizacao', { message: error.message });
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
