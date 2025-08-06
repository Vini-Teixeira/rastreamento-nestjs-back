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
const passport_1 = require("@nestjs/passport");
const firebase_auth_guard_1 = require("../auth/firebase-auth/firebase-auth.guard");
let EntregadoresController = class EntregadoresController {
    constructor(entregadoresService, authService) {
        this.entregadoresService = entregadoresService;
        this.authService = authService;
    }
    async login(driverLoginDto) {
        const driver = await this.entregadoresService.validatePassword(driverLoginDto.telefone, driverLoginDto.password);
        if (!driver) {
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        if (!driver.ativo) {
            throw new common_1.UnauthorizedException('Este entregador está inativo.');
        }
        return this.authService.loginDriver(driver);
    }
    updateMyLocation(req, updateLocationDto) {
        const driverId = req.user.sub;
        return this.entregadoresService.updateLocation(driverId, updateLocationDto);
    }
    async create(createEntregadorDto) {
        return this.entregadoresService.create(createEntregadorDto);
    }
    async findAll() {
        return this.entregadoresService.findAll();
    }
    async findOne(id) {
        return this.entregadoresService.findOne(id);
    }
    async update(id, updateEntregadorDto) {
        return this.entregadoresService.update(id, updateEntregadorDto);
    }
    async delete(id) {
        return this.entregadoresService.delete(id);
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
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)('/me/location'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_location_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", void 0)
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