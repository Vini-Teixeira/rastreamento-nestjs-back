"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EntregadoresGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregadoresGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const entregas_service_1 = require("../entregas/entregas.service");
const ws_auth_guard_1 = require("../auth/guards/ws-auth.guard");
let EntregadoresGateway = EntregadoresGateway_1 = class EntregadoresGateway {
    constructor(entregasService) {
        this.entregasService = entregasService;
        this.logger = new common_1.Logger(EntregadoresGateway_1.name);
    }
    handleConnection(client) {
        const driverId = client.user.sub;
        client.join(driverId);
        this.logger.log(`Cliente Conectado: ${client.id} (Entregador: ${driverId})`);
        client.emit('connectionSuccess', { message: 'Conectado com sucesso!' });
    }
    handleDisconnect(client) {
        const driverId = client.user ? client.user.sub : 'não autenticado';
        this.logger.log(`Cliente Desconectado: ${client.id} (Entregador: ${driverId})`);
    }
    async handleLocationUpdate(client, payload) {
        const driverIdFromToken = client.user.sub;
        this.logger.log(`Recebendo localização do entregador ${driverIdFromToken} para a entrega ${payload.deliveryId}`);
        try {
            const delivery = await this.entregasService.findOne(payload.deliveryId);
            if (!delivery.driverId || delivery.driverId._id.toString() !== driverIdFromToken) {
                throw new websockets_1.WsException('Ação não autorizada para esta entrega.');
            }
            await this.entregasService.updateDriverLocation(payload.deliveryId, payload.lat, payload.lng);
        }
        catch (error) {
            this.logger.error(`Erro ao processar localização para o entregador ${driverIdFromToken}: ${error.message}`);
            client.emit('erro_localizacao', { message: error.message });
        }
    }
    notifyNewDelivery(driverId, delivery) {
        this.logger.log(`Enviando notificação de nova entrega para a sala do entregador: ${driverId}`);
        this.server.to(driverId).emit('nova_entrega', delivery);
    }
    handleJoinDeliveryRoom(client, deliveryId) {
        client.join(deliveryId);
        this.logger.log(`Cliente ${client.id} entrou na sala da entrega: ${deliveryId}`);
    }
    handleLeaveDeliveryRoom(client, deliveryId) {
        client.leave(deliveryId);
        this.logger.log(`Cliente ${client.id} saiu da sala da entrega: ${deliveryId}`);
    }
};
exports.EntregadoresGateway = EntregadoresGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EntregadoresGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EntregadoresGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EntregadoresGateway.prototype, "handleDisconnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('atualizarLocalizacao'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EntregadoresGateway.prototype, "handleLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinDeliveryRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], EntregadoresGateway.prototype, "handleJoinDeliveryRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveDeliveryRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], EntregadoresGateway.prototype, "handleLeaveDeliveryRoom", null);
exports.EntregadoresGateway = EntregadoresGateway = EntregadoresGateway_1 = __decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregas_service_1.EntregasService))),
    __metadata("design:paramtypes", [entregas_service_1.EntregasService])
], EntregadoresGateway);
//# sourceMappingURL=entregadores.gateway.js.map