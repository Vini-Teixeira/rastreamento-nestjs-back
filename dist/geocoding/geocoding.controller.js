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
exports.GeocodingController = void 0;
const common_1 = require("@nestjs/common");
const google_maps_service_1 = require("../google-maps/google-maps.service");
const firebase_auth_guard_1 = require("../auth/firebase-auth/firebase-auth.guard");
let GeocodingController = class GeocodingController {
    constructor(googleMapsService) {
        this.googleMapsService = googleMapsService;
    }
    async getCoordsFromAddress(address) {
        console.log('--- [DEBUG] GeocodingController recebeu o endereço: ---', address);
        console.log('----------------------------------------------------');
        if (!address) {
            return { lat: 0, lng: 0 };
        }
        return this.googleMapsService.geocodeAddress(address);
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
exports.GeocodingController = GeocodingController = __decorate([
    (0, common_1.Controller)('geocoding'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __metadata("design:paramtypes", [google_maps_service_1.GoogleMapsService])
], GeocodingController);
//# sourceMappingURL=geocoding.controller.js.map