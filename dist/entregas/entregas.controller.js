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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregasController = void 0;
const common_1 = require("@nestjs/common");
const entregas_service_1 = require("./entregas.service");
const create_delivery_dto_1 = require("./dto/create-delivery.dto");
const update_delivery_dto_1 = require("./dto/update-delivery.dto");
const check_in_dto_1 = require("./dto/check-in.dto");
const delivery_status_enum_1 = require("./enums/delivery-status.enum");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const flexible_auth_guard_1 = require("../auth/flexible-auth.guard");
const rejeicao_dto_1 = require("./dto/rejeicao.dto");
const instalando_dto_1 = require("./dto/instalando.dto");
const class_validator_1 = require("class-validator");
class AssignManualDto {
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignManualDto.prototype, "driverId", void 0);
const logger = new common_1.Logger('EntregasController');
class SyncLocationDto {
}
let EntregasController = class EntregasController {
    constructor(entregasService) {
        this.entregasService = entregasService;
    }
    async syncLocations(syncLocationDto, req) {
        const user = req.user;
        logger.debug(`Handler syncLocations → req.user: ${user ? JSON.stringify({ sub: user.sub }) : 'none'}`);
        if (!user?.sub) {
            throw new common_1.UnauthorizedException('Token inválido ou ausente');
        }
        if (!syncLocationDto?.locations ||
            !Array.isArray(syncLocationDto.locations)) {
            throw new common_1.BadRequestException('Payload de localizações inválido');
        }
        await this.entregasService.bulkUpdateDriverLocations(user.sub, syncLocationDto.locations);
        return { success: true };
    }
    async findMyDeliveries(request) {
        const driver = request.user;
        if (!driver || !driver.sub) {
            throw new common_1.NotFoundException('ID do entregador não encontrado no token.');
        }
        return this.entregasService.findAllByDriverId(driver.sub);
    }
    async findDeliveryDetailsForDriver(id, request) {
        const delivery = await this.entregasService.findOne(id);
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada.`);
        }
        const driver = request.user;
        if (!delivery.driverId) {
            throw new common_1.UnauthorizedException('Esta entrega não está atribuída a nenhum entregador.');
        }
        const assigned = delivery.driverId?._id?.toString() ??
            delivery.driverId?.toString() ??
            null;
        if (assigned !== driver.sub.toString()) {
            throw new common_1.UnauthorizedException('Você não tem permissão para ver os detalhes desta entrega.');
        }
        return delivery;
    }
    async getDeliveryDirectionsForDriver(id, request) {
        const delivery = await this.entregasService.findOne(id);
        const driver = request.user;
        if (!delivery) {
            throw new common_1.NotFoundException('Entrega não encontrada.');
        }
        const assigned = delivery.driverId?._id?.toString() ??
            delivery.driverId?.toString() ??
            null;
        if (!assigned || assigned !== driver.sub.toString()) {
            throw new common_1.UnauthorizedException('Você não tem permissão para ver a rota desta entrega.');
        }
        let originCoords;
        let destinationCoords;
        if (delivery.status === delivery_status_enum_1.DeliveryStatus.A_CAMINHO &&
            delivery.driverCurrentLocation) {
            originCoords = delivery.driverCurrentLocation;
            destinationCoords = delivery.destination.coordinates;
        }
        else {
            originCoords = delivery.origin.coordinates;
            destinationCoords = delivery.destination.coordinates;
        }
        const polyline = await this.entregasService.getSnappedRoutePolyline(originCoords, destinationCoords);
        return { polyline };
    }
    async recusarEntrega(deliveryId, request, rejeicaoDto) {
        const driverId = request.user.sub;
        return this.entregasService.recusarEntrega(deliveryId, driverId, rejeicaoDto);
    }
    async assignManual(deliveryId, assignManualDto, request) {
        const lojistaId = request.user.sub;
        return this.entregasService.assignManual(deliveryId, assignManualDto.driverId, lojistaId);
    }
    async acceptDelivery(id, request) {
        const driver = request.user;
        if (!driver || !driver.sub) {
            throw new common_1.NotFoundException('ID do entregador não encontrado no token.');
        }
        return this.entregasService.acceptDelivery(id, driver.sub);
    }
    async collectItem(id, request) {
        const driver = request.user;
        return this.entregasService.collectItem(id, driver.sub);
    }
    async liberarCheckIn(deliveryId, request) {
        const lojistaId = request.user.sub;
        return this.entregasService.liberarCheckInManual(deliveryId, lojistaId);
    }
    async validarCheckIn(deliveryId, request, checkInDto) {
        const driverId = request.user.sub;
        return this.entregasService.validarCheckIn(deliveryId, driverId, checkInDto);
    }
    async realizarInstalacao(deliveryId, request, instalandoDto) {
        const driverId = request.user.sub;
        return this.entregasService.finalizarInstalacao(deliveryId, driverId, instalandoDto);
    }
    async finishDelivery(id, request) {
        const driver = request.user;
        return this.entregasService.finishDelivery(id, driver.sub);
    }
    async cancelarEntrega(deliveryId, request) {
        const lojistaId = request.user.sub;
        return this.entregasService.cancelarEntrega(deliveryId, lojistaId);
    }
    async create(createDeliveryDto, req) {
        const lojistaId = req.user.sub;
        return this.entregasService.create(createDeliveryDto, lojistaId);
    }
    async findAll(req, page = 1, limit = 8, status) {
        const user = req.user;
        if (user.role === 'admin') {
            return this.entregasService.findAll({ page, limit, status });
        }
        else {
            const lojistaId = user.sub;
            return this.entregasService.findAllBySolicitanteId(lojistaId, page, limit, status);
        }
    }
    async findAllByLojista(req, page = 1, limit = 8) {
        const lojistaId = req.user.sub;
        return this.entregasService.findAllBySolicitanteId(lojistaId, page, limit);
    }
    async findOne(id) {
        return this.entregasService.findOne(id);
    }
    async update(id, updateDeliveryDto) {
        return this.entregasService.update(id, updateDeliveryDto);
    }
    async addRoutePoint(id, lat, lng) {
        return this.entregasService.addRoutePoint(id, lat, lng);
    }
    async delete(id) {
        await this.entregasService.delete(id);
    }
    async updateDriverLocation(id, lat, lng) {
        return this.entregasService.updateDriverLocation(id, lat, lng);
    }
    async getDeliveryDirections(id) {
        const delivery = await this.entregasService.findOne(id);
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada para gerar rota.`);
        }
        let originCoords;
        let destinationCoords;
        if (delivery.status === delivery_status_enum_1.DeliveryStatus.A_CAMINHO &&
            delivery.driverCurrentLocation) {
            originCoords = delivery.driverCurrentLocation;
            destinationCoords = delivery.destination.coordinates;
        }
        else {
            originCoords = delivery.origin.coordinates;
            destinationCoords = delivery.destination.coordinates;
        }
        const polyline = await this.entregasService.getSnappedRoutePolyline(originCoords, destinationCoords);
        return { polyline };
    }
};
exports.EntregasController = EntregasController;
__decorate([
    (0, common_1.Post)('localizacoes/sync'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SyncLocationDto, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "syncLocations", null);
__decorate([
    (0, common_1.Get)('minhas-entregas'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findMyDeliveries", null);
__decorate([
    (0, common_1.Get)('detalhes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findDeliveryDetailsForDriver", null);
__decorate([
    (0, common_1.Get)('detalhes/:id/directions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "getDeliveryDirectionsForDriver", null);
__decorate([
    (0, common_1.Post)(':id/recusar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, rejeicao_dto_1.RejeicaoDto]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "recusarEntrega", null);
__decorate([
    (0, common_1.Post)(':id/assign-manual'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignManualDto, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "assignManual", null);
__decorate([
    (0, common_1.Patch)(':id/aceitar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "acceptDelivery", null);
__decorate([
    (0, common_1.Patch)(':id/coletar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "collectItem", null);
__decorate([
    (0, common_1.Patch)(':id/liberar-checkin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "liberarCheckIn", null);
__decorate([
    (0, common_1.Post)(':id/check-in'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, check_in_dto_1.CheckInDto]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "validarCheckIn", null);
__decorate([
    (0, common_1.Post)(':id/finalizar-instalacao'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, instalando_dto_1.InstalandoDto]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "realizarInstalacao", null);
__decorate([
    (0, common_1.Patch)(':id/finalizar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "finishDelivery", null);
__decorate([
    (0, common_1.Patch)(':id/cancelar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "cancelarEntrega", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_delivery_dto_1.CreateDeliveryDto, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findAllByLojista", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_delivery_dto_1.UpdateDeliveryDto]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/route-point'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('lat', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Body)('lng', common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "addRoutePoint", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/driver-location'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('lat', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Body)('lng', common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "updateDriverLocation", null);
__decorate([
    (0, common_1.Get)(':id/directions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "getDeliveryDirections", null);
exports.EntregasController = EntregasController = __decorate([
    (0, common_1.Controller)('entregas'),
    (0, common_1.UseGuards)(flexible_auth_guard_1.FlexibleAuthGuard),
    __metadata("design:paramtypes", [entregas_service_1.EntregasService])
], EntregasController);
//# sourceMappingURL=entregas.controller.js.map