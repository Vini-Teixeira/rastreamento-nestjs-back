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
exports.LojistasController = void 0;
const common_1 = require("@nestjs/common");
const lojistas_service_1 = require("./lojistas.service");
const auth_service_1 = require("../auth/auth.service");
const lojista_login_dto_1 = require("../auth/dto/lojista-login.dto");
let LojistasController = class LojistasController {
    constructor(lojistasService, authService) {
        this.lojistasService = lojistasService;
        this.authService = authService;
    }
    async login(lojistaLoginDto) {
        const lojista = await this.lojistasService.validatePassword(lojistaLoginDto.email, lojistaLoginDto.password);
        if (!lojista) {
            throw new common_1.UnauthorizedException('Credenciais de lojista inválidas.');
        }
        return this.authService.loginLojista(lojista);
    }
};
exports.LojistasController = LojistasController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lojista_login_dto_1.LojistaLoginDto]),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "login", null);
exports.LojistasController = LojistasController = __decorate([
    (0, common_1.Controller)('lojistas'),
    __metadata("design:paramtypes", [lojistas_service_1.LojistasService,
        auth_service_1.AuthService])
], LojistasController);
//# sourceMappingURL=lojistas.controller.js.map