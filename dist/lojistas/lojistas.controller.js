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
const create_lojista_dto_1 = require("./dto/create-lojista.dto");
const update_lojista_dto_1 = require("./dto/update-lojista.dto");
const admin_auth_guard_1 = require("../auth/guards/admin-auth.guard");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let LojistasController = class LojistasController {
    constructor(lojistasService, authService) {
        this.lojistasService = lojistasService;
        this.authService = authService;
    }
    async findAll(page = 1, limit = 10) {
        return this.lojistasService.findAll({ page, limit });
    }
    async login(lojistaLoginDto) {
        const lojista = await this.lojistasService.validatePassword(lojistaLoginDto.email, lojistaLoginDto.password);
        if (!lojista) {
            throw new common_1.UnauthorizedException('Credenciais de lojista inválidas.');
        }
        return this.authService.loginLojista(lojista);
    }
    async create(createLojistaDto) {
        return this.lojistasService.create(createLojistaDto);
    }
    async update(id, updateLojistaDto) {
        const updated = await this.lojistasService.update(id, updateLojistaDto);
        if (!updated) {
            throw new common_1.NotFoundException(`Lojista com ID ${id} não encontrado.`);
        }
        return updated;
    }
    async delete(id) {
        const deleted = await this.lojistasService.delete(id);
        if (!deleted) {
            throw new common_1.NotFoundException(`Lojista com ID ${id} não encontrado para remoção.`);
        }
        return { message: 'Loja removida com sucesso.' };
    }
    async getDashboardSummary(request) {
        const solicitanteId = request.user.sub;
        return this.lojistasService.getDashboardSummary(solicitanteId);
    }
    async findAllForSelection() {
        return this.lojistasService.findAllForSelection();
    }
};
exports.LojistasController = LojistasController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lojista_login_dto_1.LojistaLoginDto]),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "login", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lojista_dto_1.CreateLojistaDto]),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lojista_dto_1.UpdateLojistaDto]),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('me/dashboard-summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('para-selecao'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LojistasController.prototype, "findAllForSelection", null);
exports.LojistasController = LojistasController = __decorate([
    (0, common_1.Controller)('lojistas'),
    __metadata("design:paramtypes", [lojistas_service_1.LojistasService,
        auth_service_1.AuthService])
], LojistasController);
//# sourceMappingURL=lojistas.controller.js.map