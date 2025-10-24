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
exports.SocorroSchema = exports.Socorro = exports.SocorroStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const delivery_schema_1 = require("../../entregas/schemas/delivery.schema");
var SocorroStatus;
(function (SocorroStatus) {
    SocorroStatus["PENDING"] = "pendente";
    SocorroStatus["ACCEPTED"] = "aceito";
    SocorroStatus["ON_THE_WAY"] = "\u00E0_caminho";
    SocorroStatus["ON_SITE"] = "no_local";
    SocorroStatus["COMPLETED"] = "conclu\u00EDdo";
    SocorroStatus["CANCELLED"] = "cancelado";
})(SocorroStatus || (exports.SocorroStatus = SocorroStatus = {}));
let Socorro = class Socorro extends mongoose_2.Document {
};
exports.Socorro = Socorro;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        unique: true,
        sparse: true,
        index: true,
    }),
    __metadata("design:type", String)
], Socorro.prototype, "codigoSocorro", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lojista', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Socorro.prototype, "solicitanteId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Entregador', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Socorro.prototype, "driverId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(SocorroStatus),
        default: SocorroStatus.PENDING,
    }),
    __metadata("design:type", String)
], Socorro.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: delivery_schema_1.LocationSchema }),
    __metadata("design:type", delivery_schema_1.Location)
], Socorro.prototype, "clientLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: delivery_schema_1.LocationSchema }),
    __metadata("design:type", delivery_schema_1.Location)
], Socorro.prototype, "driverStartlocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Socorro.prototype, "serviceDescription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Socorro.prototype, "checkInLiberadoManualmente", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Socorro.prototype, "fotos", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Socorro.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Socorro.prototype, "updateAt", void 0);
exports.Socorro = Socorro = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Socorro);
exports.SocorroSchema = mongoose_1.SchemaFactory.createForClass(Socorro);
//# sourceMappingURL=socorro.schema.js.map