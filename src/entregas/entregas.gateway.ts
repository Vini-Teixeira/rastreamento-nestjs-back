import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
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