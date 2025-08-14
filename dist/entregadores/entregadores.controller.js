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
exports.EntregadoresController = void 0;
const common_1 = require("@nestjs/common");
const entregadores_service_1 = require("./entregadores.service");
const auth_service_1 = require("../auth/auth.service");
const driver_login_dto_1 = require("../auth/dto/driver-login.dto");
const create_entregador_dto_1 = require("./dto/create-entregador.dto");
const update_entregador_dto_1 = require("./dto/update-entregador.dto");
const update_location_dto_1 = require("./dto/update-location.dto");
const firebase_auth_guard_1 = require("../auth/firebase-auth/firebase-auth.guard");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const logger = new common_1.Logger('EntregadoresController');
let EntregadoresController = class EntregadoresController {
    constructor(entregadoresService, authService) {
        this.entregadoresService = entregadoresService;
        this.authService = authService;
    }
    async login(driverLoginDto) {
        const driver = await this.entregadoresService.validatePassword(driverLoginDto.telefone, driverLoginDto.password);
        if (!driver) {
            throw new common_1.UnauthorizedException('Telefone ou senha inválidos.');
        }
        if (!driver.ativo) {
            throw new common_1.UnauthorizedException('Este entregador está inativo.');
        }
        return this.authService.loginDriver(driver);
    }
    async updateMyLocation(req, updateLocationDto) {
        const authHeader = req.headers?.authorization;
        logger.log(`updateMyLocation called — Authorization header present: ${!!authHeader}`);
        const user = req.user;
        logger.debug(`updateMyLocation -> req.user (sanitized): ${user ? JSON.stringify({ sub: user.sub }) : 'none'}`);
        if (!user || !user.sub) {
            logger.warn('updateMyLocation -> req.user ausente ou sem sub; retornando 401.');
            throw new common_1.UnauthorizedException('Token JWT inválido ou ausente.');
        }
        try {
            const updated = await this.entregadoresService.updateLocation(String(user.sub), updateLocationDto);
            logger.log(`Localização atualizada com sucesso para entregador ${user.sub}`);
            return updated;
        }
        catch (err) {
            logger.error(`Erro ao atualizar localização do entregador ${user.sub}: ${err?.message ?? err}`, err?.stack);
            throw err;
        }
    }
    async create(createEntregadorDto) {
        return this.entregadoresService.create(createEntregadorDto);
    }
    async findAll() {
        return this.entregadoresService.findAll();
    }
    async findOne(id) {
        const found = await this.entregadoresService.findOne(id);
        if (!found)
            throw new common_1.NotFoundException(`Entregador com ID ${id} não encontrado.`);
        return found;
    }
    async update(id, updateEntregadorDto) {
        const updated = await this.entregadoresService.update(id, updateEntregadorDto);
        if (!updated)
            throw new common_1.NotFoundException(`Entregador com ID ${id} não encontrado para atualização.`);
        return updated;
    }
    async delete(id) {
        const deleted = await this.entregadoresService.delete(id);
        if (!deleted) {
            throw new common_1.NotFoundException(`Entregador com ID ${id} não encontrado para remoção.`);
        }
        return { message: 'Removido com sucesso' };
    }
};
exports.EntregadoresController = EntregadoresController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [driver_login_dto_1.DriverLoginDto]),
    __metadata("design:returntype", Promise)
], EntregadoresController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me/location'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_location_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", Promise)
], EntregadoresController.prototype, "updateMyLocation", null);
__decorate([
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_entregador_dto_1.CreateEntregadorDto]),
    __metadata("design:returntype", Promise)
], EntregadoresController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EntregadoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregadoresController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_entregador_dto_1.UpdateEntregadorDto]),
    __metadata("design:returntype", Promise)
], EntregadoresController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntregadoresController.prototype, "delete", null);
exports.EntregadoresController = EntregadoresController = __decorate([
    (0, common_1.Controller)('entregadores'),
    __metadata("design:paramtypes", [entregadores_service_1.EntregadoresService,
        auth_service_1.AuthService])
], EntregadoresController);
//# sourceMappingURL=entregadores.controller.js.map