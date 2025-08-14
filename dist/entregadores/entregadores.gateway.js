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
const jwt_1 = require("@nestjs/jwt");
let EntregadoresGateway = EntregadoresGateway_1 = class EntregadoresGateway {
    constructor(entregasService, jwtService) {
        this.entregasService = entregasService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(EntregadoresGateway_1.name);
    }
    async handleConnection(client) {
        try {
            let token;
            const handshake = client.handshake || {};
            if (handshake.auth && handshake.auth.token) {
                token = handshake.auth.token;
            }
            else if (handshake.query && handshake.query.token) {
                token = String(handshake.query.token);
            }
            else if (handshake.headers && handshake.headers.authorization) {
                const authHeader = String(handshake.headers.authorization);
                token = authHeader.startsWith('Bearer ')
                    ? authHeader.slice(7)
                    : authHeader;
            }
            if (!token) {
                this.logger.warn(`Socket connection rejected: no token provided (socketId=${client.id})`);
                client.emit('unauthorized', { message: 'Token missing' });
                client.disconnect(true);
                return;
            }
            let payload;
            try {
                payload = await this.jwtService.verifyAsync(token);
            }
            catch (err) {
                this.logger.warn(`Socket connection rejected: invalid token (socketId=${client.id})`);
                client.emit('unauthorized', { message: 'Token invalid' });
                client.disconnect(true);
                return;
            }
            client.data = client.data ?? {};
            client.data.user = payload;
            client.user = payload;
            try {
                client.join(payload.sub);
            }
            catch (err) {
                this.logger.warn(`Não foi possível adicionar cliente à sala do driver (${payload.sub}): ${err}`);
            }
            this.logger.log(`Socket conectado: user=${payload.sub} socketId=${client.id}`);
        }
        catch (err) {
            this.logger.error('Unexpected error in handleConnection', err);
            try {
                client.disconnect(true);
            }
            catch { }
        }
    }
    handleDisconnect(client) {
        const user = client.data?.user ?? client.user;
        const driverId = user ? user.sub : 'não autenticado';
        this.logger.log(`Cliente Desconectado: ${client.id} (Entregador: ${driverId})`);
    }
    async handleLocationUpdate(client, payload) {
        const user = client.data?.user ?? client.user;
        if (!user) {
            throw new websockets_1.WsException('Não autenticado');
        }
        const driverIdFromToken = user.sub;
        this.logger.log(`Recebendo localização do entregador ${driverIdFromToken} para a entrega ${payload.deliveryId}`);
        try {
            const delivery = await this.entregasService.findOne(payload.deliveryId);
            if (!delivery) {
                throw new websockets_1.WsException('Entrega não encontrada');
            }
            if (!delivery.driverId || delivery.driverId._id.toString() !== driverIdFromToken) {
                throw new websockets_1.WsException('Ação não autorizada para esta entrega.');
            }
            await this.entregasService.updateDriverLocation(payload.deliveryId, payload.lat, payload.lng);
            this.server.to(payload.deliveryId).emit('driver_location_updated', {
                deliveryId: payload.deliveryId,
                lat: payload.lat,
                lng: payload.lng,
                driverId: driverIdFromToken,
            });
        }
        catch (error) {
            this.logger.error(`Erro ao processar localização para o entregador ${driverIdFromToken}: ${error?.message ?? error}`);
            client.emit('erro_localizacao', { message: error?.message ?? String(error) });
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
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregas_service_1.EntregasService))),
    __metadata("design:paramtypes", [entregas_service_1.EntregasService,
        jwt_1.JwtService])
], EntregadoresGateway);
//# sourceMappingURL=entregadores.gateway.js.map