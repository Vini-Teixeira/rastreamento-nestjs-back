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
exports.UpdateDeliveryDto = exports.LocationDto = exports.CoordinatesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const delivery_status_enum_1 = require("../enums/delivery-status.enum");
class CoordinatesDto {
}
exports.CoordinatesDto = CoordinatesDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CoordinatesDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CoordinatesDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CoordinatesDto.prototype, "timestamp", void 0);
class LocationDto {
}
exports.LocationDto = LocationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LocationDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CoordinatesDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", CoordinatesDto)
], LocationDto.prototype, "coordinates", void 0);
class UpdateDeliveryDto {
}
exports.UpdateDeliveryDto = UpdateDeliveryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeliveryDto.prototype, "itemDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(delivery_status_enum_1.DeliveryStatus),
    __metadata("design:type", String)
], UpdateDeliveryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeliveryDto.prototype, "driverId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CoordinatesDto),
    __metadata("design:type", CoordinatesDto)
], UpdateDeliveryDto.prototype, "driverCurrentLocation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CoordinatesDto),
    __metadata("design:type", Array)
], UpdateDeliveryDto.prototype, "routeHistory", void 0);
//# sourceMappingURL=update-delivery.dto.js.map