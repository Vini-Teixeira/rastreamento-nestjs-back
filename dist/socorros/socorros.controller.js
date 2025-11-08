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
exports.SocorrosController = void 0;
const common_1 = require("@nestjs/common");
const socorros_service_1 = require("./socorros.service");
const create_socorro_dto_1 = require("./dto/create-socorro.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const cheguei_ao_local_dto_1 = require("./dto/cheguei-ao-local.dto");
const finalizar_socorro_dto_1 = require("./dto/finalizar-socorro.dto");
let SocorrosController = class SocorrosController {
    constructor(socorrosService) {
        this.socorrosService = socorrosService;
    }
    async create(createSocorroDto, request) {
        const solicitanteId = request.user.sub;
        return this.socorrosService.create(createSocorroDto, solicitanteId);
    }
    async findMySocorros(request) {
        const driverId = request.user.sub;
        return this.socorrosService.findAllByDriverId(driverId);
    }
    async findOne(id) {
        return this.socorrosService.findOne(id);
    }
    async accept(socorroId, request) {
        const driverId = request.user.sub;
        return this.socorrosService.acceptSocorro(socorroId, driverId);
    }
    async iniciarDeslocamento(socorroId, request) {
        const driverId = request.user.sub;
        return this.socorrosService.iniciarDeslocamento(socorroId, driverId);
    }
    async chegueiAoLocal(socorroId, request, chegueiAoLocalDto) {
        const driverId = request.user.sub;
        return this.socorrosService.chegueiAoLocal(socorroId, driverId, chegueiAoLocalDto);
    }
    async liberarCheckIn(socorroId, request) {
        const solicitanteId = request.user.sub;
        return this.socorrosService.liberarCheckInManual(socorroId, solicitanteId);
    }
    async finalizarSocorro(socorroId, request, finalizarSocorroDto) {
        const driverId = request.user.sub;
        return this.socorrosService.finalizarSocorro(socorroId, driverId, finalizarSocorroDto);
    }
};
exports.SocorrosController = SocorrosController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_socorro_dto_1.CreateSocorroDto, Object]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('meus-socorros'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "findMySocorros", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/aceitar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)(':id/iniciar-deslocamento'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "iniciarDeslocamento", null);
__decorate([
    (0, common_1.Patch)(':id/cheguei-ao-local'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, cheguei_ao_local_dto_1.ChegueiAoLocalDto]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "chegueiAoLocal", null);
__decorate([
    (0, common_1.Patch)(':id/liberar-checkin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "liberarCheckIn", null);
__decorate([
    (0, common_1.Patch)(':id/finalizar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, finalizar_socorro_dto_1.FinalizarSocorroDto]),
    __metadata("design:returntype", Promise)
], SocorrosController.prototype, "finalizarSocorro", null);
exports.SocorrosController = SocorrosController = __decorate([
    (0, common_1.Controller)('socorros'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [socorros_service_1.SocorrosService])
], SocorrosController);
//# sourceMappingURL=socorros.controller.js.map