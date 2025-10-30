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
exports.DeliverySchema = exports.Delivery = exports.RejeicaoInfoSchema = exports.LocationSchema = exports.Location = exports.CoordinatesSchema = exports.Coordinates = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const rejeicao_dto_1 = require("../dto/rejeicao.dto");
const delivery_status_enum_1 = require("../enums/delivery-status.enum");
let Coordinates = class Coordinates {
};
exports.Coordinates = Coordinates;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['Point'], default: 'Point' }),
    __metadata("design:type", String)
], Coordinates.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: [Number],
        validate: {
            validator: (value) => Array.isArray(value) &&
                value.length === 2 &&
                value.every((num) => typeof num === 'number'),
            message: 'Coordinates must be an array of [lng, lat]',
        },
    }),
    __metadata("design:type", Array)
], Coordinates.prototype, "coordinates", void 0);
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
let RejeicaoInfo = class RejeicaoInfo {
};
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], RejeicaoInfo.prototype, "motivo", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], RejeicaoInfo.prototype, "texto", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Entregador' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], RejeicaoInfo.prototype, "driverId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], RejeicaoInfo.prototype, "timestamp", void 0);
RejeicaoInfo = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], RejeicaoInfo);
exports.RejeicaoInfoSchema = mongoose_1.SchemaFactory.createForClass(RejeicaoInfo);
let Delivery = class Delivery extends mongoose_2.Document {
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
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(delivery_status_enum_1.DeliveryStatus),
        default: delivery_status_enum_1.DeliveryStatus.PENDENTE,
    }),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lojista', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Delivery.prototype, "solicitanteId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lojista', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Delivery.prototype, "origemId", void 0);
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
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: false,
        unique: true,
        sparse: true,
        index: true,
    }),
    __metadata("design:type", String)
], Delivery.prototype, "codigoEntrega", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Delivery.prototype, "checkInLiberadoManualmente", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [rejeicao_dto_1.RejeicaoDto], default: [] }),
    __metadata("design:type", Array)
], Delivery.prototype, "historicoRejeicoes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Delivery.prototype, "recolherSucata", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Delivery.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Delivery.prototype, "updateAt", void 0);
exports.Delivery = Delivery = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Delivery);
exports.DeliverySchema = mongoose_1.SchemaFactory.createForClass(Delivery);
//# sourceMappingURL=delivery.schema.js.map