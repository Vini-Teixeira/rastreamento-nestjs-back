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
exports.WsAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const logger = new common_1.Logger('WsAuthGuard');
let WsAuthGuard = class WsAuthGuard {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        try {
            const token = client.handshake?.auth?.token || (client.handshake?.headers?.authorization || '').replace(/^Bearer\s+/i, '');
            logger.debug(`WsAuthGuard → handshake.auth.token present: ${!!token}`);
            if (!token)
                throw new websockets_1.WsException('Token ausente');
            const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
            client.data = client.data || {};
            client.data.user = payload;
            logger.log(`WsAuthGuard → client ${client.id} authenticated as ${payload.sub}`);
            return true;
        }
        catch (err) {
            logger.warn('WsAuthGuard → auth failed', err);
            throw new websockets_1.WsException('Token inválido ou expirado');
        }
    }
};
exports.WsAuthGuard = WsAuthGuard;
exports.WsAuthGuard = WsAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], WsAuthGuard);
//# sourceMappingURL=ws-auth.guard.js.map