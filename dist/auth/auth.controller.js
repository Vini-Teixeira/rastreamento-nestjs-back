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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const driver_login_dto_1 = require("./dto/driver-login.dto");
const lojista_login_dto_1 = require("./dto/lojista-login.dto");
const create_lojista_dto_1 = require("../lojistas/dto/create-lojista.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async driverLogin(driverLoginDto) {
        const driver = await this.authService.validateDriver(driverLoginDto.telefone, driverLoginDto.password);
        if (!driver) {
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        if (!driver.ativo) {
            throw new common_1.UnauthorizedException('Este entregador está inativo e não pode fazer login.');
        }
        return this.authService.loginDriver(driver);
    }
    async registerLojista(createLojistaDto) {
        return this.authService.registerLojista(createLojistaDto);
    }
    async lojistaLogin(lojistaLoginDto) {
        const lojista = await this.authService.validateLojista(lojistaLoginDto.email, lojistaLoginDto.password);
        if (!lojista) {
            throw new common_1.UnauthorizedException('Credenciais de lojista inválidas.');
        }
        return this.authService.loginLojista(lojista);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('driver/login'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [driver_login_dto_1.DriverLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "driverLogin", null);
__decorate([
    (0, common_1.Post)('lojista/register'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lojista_dto_1.CreateLojistaDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerLojista", null);
__decorate([
    (0, common_1.Post)('lojista/login'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lojista_login_dto_1.LojistaLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "lojistaLogin", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map