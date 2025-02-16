import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { EntregadoresService } from './entregadores.service';
import { Logger, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@WebSocketGateway({ cors: true })
export class EntregadoresGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EntregadoresGateway.name);

  constructor(private entregadoresService: EntregadoresService) {}

  handleConnection(client: any) {
      this.logger.log(`Cliente Conectado: ${client.id}`);
      client.emit('connectionSuccess', { message: 'Conectado com sucesso!' });
  }

  handleDisconnect(client: any) {
      this.logger.log(`Cliente Desconectado: ${client.id}`);
  }

  @SubscribeMessage('atualizarLocalizacao')
  async handleLocationUpdate(
      client: any,
      payload: { id: string; lat: number; lng: number },
  ) {
      this.logger.log(` Localização recebida: ${JSON.stringify(payload)}`);
      this.logger.log(`Tipo de payload.id: ${typeof payload.id}, Valor de payload.id: ${payload.id}`);

      try {
          const isValidObjectId = Types.ObjectId.isValid(payload.id);

          if (!isValidObjectId) {
              this.logger.error(`ID inválido: ${payload.id}`);
              throw new BadRequestException('ID do entregador inválido');
          }

          const objectId = new Types.ObjectId(payload.id);

          await this.entregadoresService.atualizarLocalizacao(
              objectId,
              payload.lat,
              payload.lng,
          );
          this.server.emit('novaLocalizacao', payload);
      } catch (error) {
          this.logger.error(`Erro ao atualizar localização: ${error}`);

          if (error instanceof BadRequestException) {
              client.emit('erroAtualizarLocalizacao', { message: error.message });
          } else {
              client.emit('erroAtualizarLocalizacao', {
                  message: 'Falha ao atualizar localização',
              });
          }
      }
  }
}