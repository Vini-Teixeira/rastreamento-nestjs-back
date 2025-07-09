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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const entregadores_service_1 = require("../entregadores/entregadores.service");
const lojistas_service_1 = require("../lojistas/lojistas.service");
let AuthService = class AuthService {
    constructor(entregadoresService, lojistasService, jwtService) {
        this.entregadoresService = entregadoresService;
        this.lojistasService = lojistasService;
        this.jwtService = jwtService;
    }
    async validateDriver(telefone, pass) {
        const driver = await this.entregadoresService.findOneByPhoneWithPassword(telefone);
        if (driver && (await bcrypt.compare(pass, driver.password))) {
            const { password, ...result } = driver.toObject();
            return result;
        }
        return null;
    }
    async loginDriver(driver) {
        const payload = { sub: driver._id, telefone: driver.telefone };
        return {
            message: 'Login bem-sucedido!',
            access_token: this.jwtService.sign(payload),
        };
    }
    async registerLojista(createLojistaDto) {
        const existingLojista = await this.lojistasService.findOneByEmail(createLojistaDto.email);
        if (existingLojista) {
            throw new common_1.ConflictException('Este email já está cadastrado.');
        }
        return this.lojistasService.create(createLojistaDto);
    }
    async validateLojista(email, pass) {
        const lojista = await this.lojistasService.findOneByEmailWithPassword(email);
        if (lojista && (await bcrypt.compare(pass, lojista.password))) {
            const { password, ...result } = lojista.toObject();
            return result;
        }
        return null;
    }
    async loginLojista(lojista) {
        const payload = { sub: lojista._id, email: lojista.email, type: 'lojista' };
        return {
            message: 'Login bem sucedido!',
            access_token: this.jwtService.sign(payload),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [entregadores_service_1.EntregadoresService,
        lojistas_service_1.LojistasService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map