import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
    data?: {
        user?: JwtPayload;
    };
};
export declare class EntregadoresGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly entregasService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, entregasService: EntregasService);
    private getTokenFromHandshake;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    onJoinDeliveryRoom(client: AuthenticatedSocket, data: {
        deliveryId: string;
    }): void;
    onLeaveDeliveryRoom(client: AuthenticatedSocket, data: {
        deliveryId: string;
    }): void;
    notifyNewDelivery(driverId: string, delivery: any): void;
    notifyDeliveryStatusChanged(delivery: any): void;
    emitDriverLocation(deliveryId: string, payload: {
        driverId: string | null;
        location: any;
    }): void;
    handleLocationUpdate(data: {
        deliveryId: string;
        lat: number;
        lng: number;
    }): Promise<void>;
}
