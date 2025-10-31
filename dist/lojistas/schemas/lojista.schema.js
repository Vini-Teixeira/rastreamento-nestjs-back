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
exports.LojistaSchema = exports.Lojista = exports.Coordinates = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
let Coordinates = class Coordinates {
};
exports.Coordinates = Coordinates;
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['Point'], default: 'Point' }),
    __metadata("design:type", String)
], Coordinates.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number] }),
    __metadata("design:type", Array)
], Coordinates.prototype, "coordinates", void 0);
exports.Coordinates = Coordinates = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Coordinates);
let Lojista = class Lojista extends mongoose_2.Document {
};
exports.Lojista = Lojista;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Lojista.prototype, "nomeFantasia", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Lojista.prototype, "cnpj", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Lojista.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Lojista.prototype, "endereco", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], Lojista.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Coordinates }),
    __metadata("design:type", Coordinates)
], Lojista.prototype, "coordinates", void 0);
exports.Lojista = Lojista = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'lojistas' })
], Lojista);
exports.LojistaSchema = mongoose_1.SchemaFactory.createForClass(Lojista);
exports.LojistaSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
//# sourceMappingURL=lojista.schema.js.map