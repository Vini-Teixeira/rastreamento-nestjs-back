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
const entregadores_service_1 = require("./entregadores.service");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const entregas_service_1 = require("../entregas/entregas.service");
const jwt_1 = require("@nestjs/jwt");
let EntregadoresGateway = EntregadoresGateway_1 = class EntregadoresGateway {
    constructor(entregadoresService, entregasService, jwtService) {
        this.entregadoresService = entregadoresService;
        this.entregasService = entregasService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(EntregadoresGateway_1.name);
    }
    handleConnection(client) {
        this.logger.log(`Cliente Conectado: ${client.id}`);
        client.emit('connectionSuccess', { message: 'Conectado!' });
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente Desconectado: ${client.id}`);
    }
    async handleJoinDeliveryRoom(client, deliveryId) {
        const idToValidate = String(deliveryId);
        if (!idToValidate || !mongoose_1.Types.ObjectId.isValid(idToValidate)) {
            throw new websockets_1.WsException('ID da entrega inválido para entrar na sala.');
        }
        client.join(idToValidate);
        this.logger.log(`Cliente ${client.id} entrou na sala da entrega: ${idToValidate}`);
    }
    handleLeaveDeliveryRoom(client, deliveryId) {
        client.leave(deliveryId);
        this.logger.log(`Cliente ${client.id} saiu da sala da entrega: ${deliveryId}`);
    }
    async handleLocationUpdate(client, payload) {
        try {
            const decodedToken = this.jwtService.verify(payload.token);
            const driverIdFromToken = decodedToken.sub;
            const delivery = await this.entregasService.findOne(payload.deliveryId);
            if (!delivery) {
                throw new websockets_1.WsException('Entrega não encontrada.');
            }
            if (!delivery.driverId) {
                throw new websockets_1.WsException('A entrega não possui um entregador atribuído.');
            }
            if (delivery.driverId._id.toString() !== driverIdFromToken) {
                throw new websockets_1.WsException('Token não autorizado para esta entrega.');
            }
            await this.entregasService.updateDriverLocation(payload.deliveryId, payload.lat, payload.lng);
            client.emit('localizacaoRecebida', { success: true });
        }
        catch (error) {
            this.logger.error(`Erro no evento 'enviarLocalizacao': ${error.message}`);
            client.emit('erroLocalizacao', { message: error.message });
            throw new websockets_1.WsException(error.message);
        }
    }
};
exports.EntregadoresGateway = EntregadoresGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EntregadoresGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinDeliveryRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], EntregadoresGateway.prototype, "handleJoinDeliveryRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveDeliveryRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], EntregadoresGateway.prototype, "handleLeaveDeliveryRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('enviarLocalizacao'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EntregadoresGateway.prototype, "handleLocationUpdate", null);
exports.EntregadoresGateway = EntregadoresGateway = EntregadoresGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregas_service_1.EntregasService))),
    __metadata("design:paramtypes", [entregadores_service_1.EntregadoresService,
        entregas_service_1.EntregasService,
        jwt_1.JwtService])
], EntregadoresGateway);
//# sourceMappingURL=entregadores.gateway.js.map