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
var GeocodingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingController = void 0;
const common_1 = require("@nestjs/common");
const google_maps_service_1 = require("../google-maps/google-maps.service");
const flexible_auth_guard_1 = require("../auth/flexible-auth.guard");
let GeocodingController = GeocodingController_1 = class GeocodingController {
    constructor(googleMapsService) {
        this.googleMapsService = googleMapsService;
        this.logger = new common_1.Logger(GeocodingController_1.name);
    }
    async getCoordsFromAddress(address) {
        this.logger.debug(`GeocodingController recebeu o endereço: ${address}`);
        if (!address || address.trim().length === 0) {
            this.logger.debug('Endereço vazio recebido — retornando ponto (0,0)');
            return { type: 'Point', coordinates: [0, 0] };
        }
        try {
            const coords = await this.googleMapsService.geocodeAddress(address);
            this.logger.debug(`GeocodingController retornando: ${JSON.stringify(coords)}`);
            return coords;
        }
        catch (err) {
            this.logger.error('Erro no geocoding', err);
            return { type: 'Point', coordinates: [0, 0] };
        }
    }
};
exports.GeocodingController = GeocodingController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GeocodingController.prototype, "getCoordsFromAddress", null);
exports.GeocodingController = GeocodingController = GeocodingController_1 = __decorate([
    (0, common_1.Controller)('geocoding'),
    (0, common_1.UseGuards)(flexible_auth_guard_1.FlexibleAuthGuard),
    __metadata("design:paramtypes", [google_maps_service_1.GoogleMapsService])
], GeocodingController);
//# sourceMappingURL=geocoding.controller.js.map