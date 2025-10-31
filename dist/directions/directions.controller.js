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
exports.DirectionsController = void 0;
const common_1 = require("@nestjs/common");
const google_maps_service_1 = require("../google-maps/google-maps.service");
const flexible_auth_guard_1 = require("../auth/flexible-auth.guard");
const class_validator_1 = require("class-validator");
class DirectionsQueryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DirectionsQueryDto.prototype, "origin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DirectionsQueryDto.prototype, "destination", void 0);
let DirectionsController = class DirectionsController {
    constructor(googleMapsService) {
        this.googleMapsService = googleMapsService;
    }
    async getDirections(query) {
        const [originLat, originLng] = query.origin.split(',').map(Number);
        const [destLat, destLng] = query.destination.split(',').map(Number);
        const originCoords = { type: 'Point', coordinates: [originLng, originLat] };
        const destinationCoords = { type: 'Point', coordinates: [destLng, destLat] };
        const polyline = await this.googleMapsService.getDirections(originCoords, destinationCoords);
        return { polyline };
    }
};
exports.DirectionsController = DirectionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DirectionsQueryDto]),
    __metadata("design:returntype", Promise)
], DirectionsController.prototype, "getDirections", null);
exports.DirectionsController = DirectionsController = __decorate([
    (0, common_1.Controller)('directions'),
    (0, common_1.UseGuards)(flexible_auth_guard_1.FlexibleAuthGuard),
    __metadata("design:paramtypes", [google_maps_service_1.GoogleMapsService])
], DirectionsController);
//# sourceMappingURL=directions.controller.js.map