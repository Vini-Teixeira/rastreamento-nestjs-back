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
exports.DeliverySchema = exports.Delivery = exports.LocationSchema = exports.Location = exports.CoordinatesSchema = exports.Coordinates = exports.DeliveryStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["ACCEPTED"] = "accepted";
    DeliveryStatus["ON_THE_WAY"] = "on_the_way";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["CANCELLED"] = "cancelled";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let Coordinates = class Coordinates {
};
exports.Coordinates = Coordinates;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Coordinates.prototype, "lat", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Coordinates.prototype, "lng", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Coordinates.prototype, "timestamp", void 0);
exports.Coordinates = Coordinates = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Coordinates);
exports.CoordinatesSchema = mongoose_1.SchemaFactory.createForClass(Coordinates);
let Location = class Location {
};
exports.Location = Location;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Location.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: exports.CoordinatesSchema }),
    __metadata("design:type", Coordinates)
], Location.prototype, "coordinates", void 0);
exports.Location = Location = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Location);
exports.LocationSchema = mongoose_1.SchemaFactory.createForClass(Location);
let Delivery = class Delivery {
};
exports.Delivery = Delivery;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: exports.LocationSchema }),
    __metadata("design:type", Location)
], Delivery.prototype, "origin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: exports.LocationSchema }),
    __metadata("design:type", Location)
], Delivery.prototype, "destination", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Delivery.prototype, "itemDescription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING }),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Entregador', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Delivery.prototype, "driverId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.CoordinatesSchema] }),
    __metadata("design:type", Array)
], Delivery.prototype, "routeHistory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: exports.CoordinatesSchema }),
    __metadata("design:type", Coordinates)
], Delivery.prototype, "driverCurrentLocation", void 0);
exports.Delivery = Delivery = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Delivery);
exports.DeliverySchema = mongoose_1.SchemaFactory.createForClass(Delivery);
//# sourceMappingURL=delivery.schema.js.map