import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EntregasService } from '../entregas/entregas.service';
import { DeliveryDocument } from 'src/entregas/schemas/delivery.schema';
type AuthenticatedSocket = Socket & {
    user: {
        sub: string;
        email: string;
    };
};
export declare class EntregadoresGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private entregasService;
    server: Server;
    private readonly logger;
    constructor(entregasService: EntregasService);
    handleConnection(client: AuthenticatedSocket): void;
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
