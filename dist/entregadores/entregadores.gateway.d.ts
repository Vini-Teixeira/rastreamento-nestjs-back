import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EntregasService } from '../entregas/entregas.service';
import { JwtService } from '@nestjs/jwt';
import { DeliveryDocument } from 'src/entregas/schemas/delivery.schema';
type JwtPayload = {
    sub: string;
    email?: string;
    [k: string]: any;
};
type AuthenticatedSocket = Socket & {
    user?: JwtPayload;
    data?: {
        user?: JwtPayload;
    };
};
export declare class EntregadoresGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private entregasService;
    private readonly jwtService;
    server: Server;
    private readonly logger;
    constructor(entregasService: EntregasService, jwtService: JwtService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleLocationUpdate(client: AuthenticatedSocket, payload: {
        deliveryId: string;
        lat: number;
        lng: number;
    }): Promise<void>;
    notifyNewDelivery(driverId: string, delivery: DeliveryDocument): void;
    handleJoinDeliveryRoom(client: Socket, deliveryId: string): void;
    handleLeaveDeliveryRoom(client: Socket, deliveryId: string): void;
}
export {};
