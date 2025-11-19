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
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const entregas_service_1 = require("../entregas/entregas.service");
let EntregadoresGateway = EntregadoresGateway_1 = class EntregadoresGateway {
    constructor(jwtService, entregasService) {
        this.jwtService = jwtService;
        this.entregasService = entregasService;
        this.logger = new common_1.Logger(EntregadoresGateway_1.name);
    }
    getTokenFromHandshake(client) {
        const handshake = client.handshake || {};
        if (handshake.auth && handshake.auth.token) {
            return String(handshake.auth.token);
        }
        if (handshake.query && handshake.query.token) {
            return String(handshake.query.token);
        }
        if (handshake.headers && handshake.headers.authorization) {
            const authHeader = String(handshake.headers.authorization);
            return authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : authHeader;
        }
        return undefined;
    }
    async handleConnection(client) {
        try {
            const token = this.getTokenFromHandshake(client);
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
        const u = client.data?.user?.sub
            ? `user=${client.data.user.sub}`
            : 'Entregador: não autenticado';
        this.logger.log(`Cliente Desconectado: ${client.id} (${u})`);
    }
    onJoinDeliveryRoom(client, data) {
        const user = client.data?.user;
        if (!user?.sub) {
            client.emit('unauthorized', { message: 'Token invalid or missing' });
            client.disconnect(true);
            return;
        }
        if (!data?.deliveryId) {
            client.emit('bad_request', { message: 'deliveryId obrigatório' });
            return;
        }
        client.join(data.deliveryId);
        this.logger.log(`Socket ${client.id} entrou na sala da entrega ${data.deliveryId}`);
    }
    onLeaveDeliveryRoom(client, data) {
        if (!data?.deliveryId) {
            client.emit('bad_request', { message: 'deliveryId obrigatório' });
            return;
        }
        client.leave(data.deliveryId);
        this.logger.log(`Socket ${client.id} saiu da sala da entrega ${data.deliveryId}`);
    }
    notifyNewDelivery(driverId, delivery) {
        try {
            this.server.to(driverId).emit('nova_entrega', delivery);
            this.logger.log(`Enviando notificação de nova entrega para a sala do entregador: ${driverId}`);
        }
        catch (err) {
            this.logger.error(`Erro ao notificar nova entrega para driver ${driverId}`, err);
        }
    }
    notifyDeliveryStatusChanged(delivery) {
        try {
            const deliveryId = String(delivery._id ?? delivery.id);
            const driverId = String(delivery.driverId?._id ?? delivery.driverId ?? '');
            const solicitanteId = String(delivery.solicitanteId?._id ?? delivery.solicitanteId ?? '');
            const payload = {
                deliveryId: deliveryId,
                status: delivery.status,
                driverId: driverId,
                payload: delivery,
            };
            this.server.to(deliveryId).emit('delivery_updated', payload);
            if (driverId) {
                this.server.to(driverId).emit('delivery_updated', payload);
            }
            if (solicitanteId) {
                this.server.to(solicitanteId).emit('delivery_updated', payload);
            }
            this.logger.log(`Emitindo 'delivery_updated' para a sala da entrega ${deliveryId} com status ${delivery.status}`);
        }
        catch (err) {
            this.logger.error(`Erro ao emitir 'delivery_updated' para a entrega ${String(delivery._id ?? delivery.id)}`, err);
        }
    }
    notifySocorroStatusChanged(socorro) {
        try {
            const socorroId = String(socorro._id ?? socorro.id);
            const driverId = String(socorro.driverId?._id ?? socorro.driverId ?? '');
            const payload = {
                socorroId: socorroId,
                status: socorro.status,
                driverId: driverId,
                payload: socorro,
            };
            this.server.to(socorroId).emit('socorro_updated', payload);
            if (driverId) {
                this.server.to(driverId).emit('socorro_updated', payload);
            }
            this.logger.log(`Emitindo 'socorro_updated' para a sala do socorro ${socorroId} com status ${socorro.status}`);
        }
        catch (err) {
            this.logger.error(`Erro ao emitir 'socorro_updated' para o socorro ${String(socorro._id ?? socorro.id)}`, err);
        }
    }
    notifyStoreSelfDelivery(delivery) {
        const solicitanteId = this._getSafeId(delivery.solicitanteId);
        if (!solicitanteId) {
            this.logger.error(`[notifyStoreSelfDelivery] Falha: solicitanteId não encontrado.`);
            return;
        }
        try {
            this.server.to(solicitanteId).emit('nova_notificacao_loja', {
                tipo: 'SUCCESS',
                titulo: `Entrega Criada (#${delivery.codigoEntrega})`,
                mensagem: `Sua entrega para ${delivery.destination.address} foi criada.`,
                delivery: delivery,
            });
            this.logger.log(`Notificação de Entrega Própria enviada para ${solicitanteId}`);
        }
        catch (err) {
            this.logger.error(`Erro ao notificar loja (própria): ${err}`);
        }
    }
    notifyStorePartnerDelivery(delivery) {
        const solicitanteId = this._getSafeId(delivery.solicitanteId);
        const origemId = this._getSafeId(delivery.origemId);
        if (!origemId || !solicitanteId || solicitanteId === origemId)
            return;
        try {
            this.server.to(origemId).emit('nova_notificacao_loja', {
                tipo: 'INFO',
                titulo: 'Coleta de Parceira',
                mensagem: `Uma entrega (#${delivery.codigoEntrega}) solicitada por ${delivery.solicitanteId?.nomeFantasia} requer coleta. Item: ${delivery.itemDescription}`,
                delivery: delivery,
            });
            this.server.to(solicitanteId).emit('nova_notificacao_loja', {
                tipo: 'SUCCESS',
                titulo: 'Entrega Parceira Criada',
                mensagem: `Sua entrega (#${delivery.codigoEntrega}) aguarda coleta em ${delivery.origin.name}.`,
                delivery: delivery,
            });
            this.logger.log(`Notificação de Parceira enviada para ${solicitanteId} e ${origemId}`);
        }
        catch (err) {
            this.logger.error(`Erro ao notificar lojas (parceira): ${err}`);
        }
    }
    notifyStoreDeliveryWarning(delivery) {
        try {
            const solicitanteId = this._getSafeId(delivery.solicitanteId);
            const origemId = this._getSafeId(delivery.origemId);
            const payload = {
                tipo: 'WARNING',
                titulo: `Entrega em Risco (#${delivery.codigoEntrega})`,
                mensagem: `A entrega para ${delivery.destination.address} foi recusada ${delivery.rejectionCount} vezes. Verifique o status.`,
                delivery: delivery,
            };
            if (solicitanteId)
                this.server.to(solicitanteId).emit('nova_notificacao_loja', payload);
            if (origemId && origemId !== solicitanteId)
                this.server.to(origemId).emit('nova_notificacao_loja', payload);
            this.logger.warn(`Notificação de AVISO (3+ recusas) enviada para a entrega ${delivery.codigoEntrega}`);
        }
        catch (err) {
            this.logger.error(`Erro ao notificar lojas (aviso): ${err}`);
        }
    }
    notifyStoreDeliveryUnassigned(delivery) {
        try {
            const solicitanteId = this._getSafeId(delivery.solicitanteId);
            if (!solicitanteId) {
                this.logger.error(`[notifyStoreDeliveryUnassigned] Falha: solicitanteId não encontrado.`);
                return;
            }
            const payload = {
                tipo: 'ERROR',
                titulo: `Ação Necessária (#${delivery.codigoEntrega})`,
                mensagem: `Nenhum motorista foi encontrado para esta entrega. Atribua um motorista manualmente.`,
                delivery: delivery,
            };
            this.server.to(solicitanteId).emit('nova_notificacao_loja', payload);
            this.logger.error(`Notificação de NÃO ATRIBUÍDA enviada para ${solicitanteId} (Entrega ${delivery.codigoEntrega})`);
        }
        catch (err) {
            this.logger.error(`Erro ao notificar lojas (não atribuída): ${err}`);
        }
    }
    notifyStoreSocorroCreated(socorro) {
        const solicitanteId = socorro.solicitanteId?.toString();
        if (!solicitanteId)
            return;
        try {
            this.server.to(solicitanteId).emit('nova_notificacao_loja', {
                tipo: 'SUCCESS',
                titulo: `Entrega criada (#${socorro.codigoEntrega})`,
                mensagem: `Sua entrega para ${socorro.destination.address} foi criada!`,
                socorro: socorro
            });
            this.logger.log(`Notificação de Socorro enviada para ${solicitanteId}`);
        }
        catch (err) {
            this.logger.error(`Erro ao notificar loja (própria): ${err}`);
        }
    }
    emitDriverLocation(deliveryId, payload) {
        try {
            this.server.to(deliveryId).emit('novaLocalizacao', {
                deliveryId,
                ...payload,
            });
            this.logger.log(`WS: novaLocalizacao emitida para sala da entrega ${deliveryId} (payload completo: ${Object.keys(payload).join(', ')})`);
        }
        catch (err) {
            this.logger.error(`Erro ao emitir novaLocalizacao para entrega ${deliveryId}`, err);
        }
    }
    async handleLocationUpdate(data) {
        if (!data || !data.deliveryId) {
            this.logger.warn('Gateway: Recebida atualização de localização sem dados ou deliveryId.');
            return;
        }
        this.logger.log(`Gateway: Recebida atualização da localização para a entrega ${data.deliveryId}`);
        await this.entregasService.updateDriverLocation(data.deliveryId, data.lat, data.lng);
    }
    _getSafeId(data) {
        if (!data)
            return null;
        if (typeof data === 'string')
            return data;
        if (data._id)
            return data._id.toString();
        return null;
    }
};
exports.EntregadoresGateway = EntregadoresGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EntregadoresGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_delivery'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EntregadoresGateway.prototype, "onJoinDeliveryRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_delivery'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EntregadoresGateway.prototype, "onLeaveDeliveryRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('atualizarLocalizacao'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EntregadoresGateway.prototype, "handleLocationUpdate", null);
exports.EntregadoresGateway = EntregadoresGateway = EntregadoresGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH'],
            allowedHeaders: ['authorization', 'content-type'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        namespace: '/',
    }),
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregas_service_1.EntregasService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        entregas_service_1.EntregasService])
], EntregadoresGateway);
//# sourceMappingURL=entregadores.gateway.js.map