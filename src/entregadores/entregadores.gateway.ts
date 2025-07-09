import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EntregadoresService } from './entregadores.service';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Types } from 'mongoose';
import { EntregasService } from '../entregas/entregas.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true })
export class EntregadoresGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EntregadoresGateway.name);

  constructor(
    private entregadoresService: EntregadoresService,
    @Inject(forwardRef(() => EntregasService))
    private entregasService: EntregasService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente Conectado: ${client.id}`);
    client.emit('connectionSuccess', { message: 'Conectado!' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente Desconectado: ${client.id}`);
  }

  @SubscribeMessage('joinDeliveryRoom')
  async handleJoinDeliveryRoom(client: Socket, deliveryId: string) {
    const idToValidate = String(deliveryId);
    if (!idToValidate || !Types.ObjectId.isValid(idToValidate)) {
      throw new WsException('ID da entrega inválido para entrar na sala.');
    }
    client.join(idToValidate);
    this.logger.log(`Cliente ${client.id} entrou na sala da entrega: ${idToValidate}`);
  }

  @SubscribeMessage('leaveDeliveryRoom')
  handleLeaveDeliveryRoom(client: Socket, deliveryId: string) {
    client.leave(deliveryId);
    this.logger.log(`Cliente ${client.id} saiu da sala da entrega: ${deliveryId}`);
  }

  @SubscribeMessage('enviarLocalizacao')
  async handleLocationUpdate(
    client: Socket,
    payload: { token: string; deliveryId: string; lat: number; lng: number },
  ) {
    try {
      const decodedToken = this.jwtService.verify(payload.token);
      const driverIdFromToken = decodedToken.sub;

      const delivery = await this.entregasService.findOne(payload.deliveryId);
      if (!delivery) {
        throw new WsException('Entrega não encontrada.');
      }

      if (!delivery.driverId) {
        throw new WsException('A entrega não possui um entregador atribuído.');
      }
      
      if (delivery.driverId._id.toString() !== driverIdFromToken) {
        throw new WsException('Token não autorizado para esta entrega.');
      }

      await this.entregasService.updateDriverLocation(
        payload.deliveryId,
        payload.lat,
        payload.lng,
      );
      
      client.emit('localizacaoRecebida', { success: true });

    } catch (error) {
      this.logger.error(`Erro no evento 'enviarLocalizacao': ${error.message}`);
      client.emit('erroLocalizacao', { message: error.message });
      throw new WsException(error.message);
    }
  }
}
