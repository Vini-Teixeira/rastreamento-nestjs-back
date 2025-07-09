import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EntregadoresService } from './entregadores.service';
import { EntregasService } from '../entregas/entregas.service';
import { JwtService } from '@nestjs/jwt';
export declare class EntregadoresGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private entregadoresService;
    private entregasService;
    private jwtService;
    server: Server;
    private readonly logger;
    constructor(entregadoresService: EntregadoresService, entregasService: EntregasService, jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinDeliveryRoom(client: Socket, deliveryId: string): Promise<void>;
    handleLeaveDeliveryRoom(client: Socket, deliveryId: string): void;
    handleLocationUpdate(client: Socket, payload: {
        token: string;
        deliveryId: string;
        lat: number;
        lng: number;
    }): Promise<void>;
}
