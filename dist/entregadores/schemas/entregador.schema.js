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
exports.EntregadorSchema = exports.Entregador = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = require("bcrypt");
let Entregador = class Entregador {
};
exports.Entregador = Entregador;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Entregador.prototype, "nome", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Entregador.prototype, "telefone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Boolean)
], Entregador.prototype, "ativo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], Entregador.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Entregador.prototype, "emEntrega", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], Entregador.prototype, "localizacao", void 0);
exports.Entregador = Entregador = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Entregador);
exports.EntregadorSchema = mongoose_1.SchemaFactory.createForClass(Entregador)
    .index({ localizacao: '2dsphere' });
exports.EntregadorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
//# sourceMappingURL=entregador.schema.js.map