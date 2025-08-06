import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from 'src/auth/guards/ws-auth.guard'; 

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class EntregasGateway {
  @WebSocketServer()
  server: Server;
}