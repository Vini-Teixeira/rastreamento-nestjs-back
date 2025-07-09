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
const delivery_schema_1 = require("./schemas/delivery.schema");
const firebase_auth_guard_1 = require("../auth/firebase-auth/firebase-auth.guard");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let EntregasController = class EntregasController {
    constructor(entregasService) {
        this.entregasService = entregasService;
    }
    async findMyDeliveries(request) {
        const driver = request.user;
        if (!driver || !driver._id) {
            throw new common_1.NotFoundException('ID do entregador não encontrado no token.');
        }
        return this.entregasService.findAllByDriverId(driver._id);
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
        if (delivery.driverId._id.toString() !== driver._id.toString()) {
            throw new common_1.UnauthorizedException('Você não tem permissão para ver os detalhes desta entrega.');
        }
        return delivery;
    }
    async getDeliveryDirectionsForDriver(id, request) {
        const delivery = await this.entregasService.findOne(id);
        const driver = request.user;
        if (!delivery)
            throw new common_1.NotFoundException('Entrega não encontrada.');
        if (!delivery.driverId || delivery.driverId._id.toString() !== driver._id.toString()) {
            throw new common_1.UnauthorizedException('Você não tem permissão para ver a rota desta entrega.');
        }
        let originCoords;
        let destinationCoords;
        if (delivery.status.toUpperCase() === 'ON_THE_WAY' && delivery.driverCurrentLocation) {
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
    async acceptDelivery(id, request) {
        const delivery = await this.entregasService.findOne(id);
        const driver = request.user;
        if (!delivery)
            throw new common_1.NotFoundException('Entrega não encontrada.');
        if (!delivery.driverId || delivery.driverId._id.toString() !== driver._id.toString()) {
            throw new common_1.UnauthorizedException('Você não tem permissão para modificar esta entrega.');
        }
        if (delivery.status !== delivery_schema_1.DeliveryStatus.PENDING) {
            throw new common_1.ForbiddenException('Apenas entregas pendentes podem ser aceitas.');
        }
        return this.entregasService.update(id, { status: delivery_schema_1.DeliveryStatus.ACCEPTED });
    }
    async collectItem(id, request) {
        const delivery = await this.entregasService.findOne(id);
        const driver = request.user;
        if (!delivery)
            throw new common_1.NotFoundException('Entrega não encontrada.');
        if (!delivery.driverId || delivery.driverId._id.toString() !== driver._id.toString()) {
            throw new common_1.UnauthorizedException('Você não tem permissão para modificar esta entrega.');
        }
        if (delivery.status !== delivery_schema_1.DeliveryStatus.ACCEPTED) {
            throw new common_1.ForbiddenException('Apenas entregas com status "accepted" podem ser coletadas.');
        }
        return this.entregasService.update(id, { status: delivery_schema_1.DeliveryStatus.ON_THE_WAY });
    }
    async finishDelivery(id, request) {
        const delivery = await this.entregasService.findOne(id);
        const driver = request.user;
        if (!delivery)
            throw new common_1.NotFoundException('Entrega não encontrada.');
        if (!delivery.driverId || delivery.driverId._id.toString() !== driver._id.toString()) {
            throw new common_1.UnauthorizedException('Você não tem permissão para modificar esta entrega.');
        }
        if (delivery.status !== delivery_schema_1.DeliveryStatus.ON_THE_WAY) {
            throw new common_1.ForbiddenException('Apenas entregas "a caminho" podem ser finalizadas.');
        }
        return this.entregasService.update(id, { status: delivery_schema_1.DeliveryStatus.DELIVERED });
    }
    async create(createDeliveryDto) {
        return this.entregasService.create(createDeliveryDto);
    }
    async findAll(statusStrings, page = 1, limit = 8) {
        const statuses = statusStrings
            .filter((s) => Object.values(delivery_schema_1.DeliveryStatus).includes(s))
            .map((s) => s);
        return this.entregasService.findFilteredAndPaginated(statuses, page, limit);
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
        if (delivery.status === delivery_schema_1.DeliveryStatus.ON_THE_WAY &&
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
    (0, common_1.Get)('minhas-entregas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findMyDeliveries", null);
__decorate([
    (0, common_1.Get)('detalhes/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findDeliveryDetailsForDriver", null);
__decorate([
    (0, common_1.Get)('detalhes/:id/directions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "getDeliveryDirectionsForDriver", null);
__decorate([
    (0, common_1.Patch)(':id/aceitar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "acceptDelivery", null);
__decorate([
    (0, common_1.Patch)(':id/coletar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "collectItem", null);
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
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_delivery_dto_1.CreateDeliveryDto]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Query)('status', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ separator: ',', optional: true }))),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Number, Number]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_delivery_dto_1.UpdateDeliveryDto]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/route-point'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
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
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/driver-location'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
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
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregasController.prototype, "getDeliveryDirections", null);
exports.EntregasController = EntregasController = __decorate([
    (0, common_1.Controller)('entregas'),
    __metadata("design:paramtypes", [entregas_service_1.EntregasService])
], EntregasController);
//# sourceMappingURL=entregas.controller.js.map