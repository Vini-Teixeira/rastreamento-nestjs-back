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
const mongoose_2 = require("mongoose");
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
    (0, mongoose_1.Prop)({ type: Number, required: true, default: 0 }),
    __metadata("design:type", Number)
], Entregador.prototype, "recusasConsecutivas", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false, default: null }),
    __metadata("design:type", Date)
], Entregador.prototype, "lastHeartbeat", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Entregador.prototype, "horarioTrabalho", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lojista', required: false, default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Entregador.prototype, "lojaBaseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], Entregador.prototype, "localizacao", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false, index: true }),
    __metadata("design:type", String)
], Entregador.prototype, "fcmToken", void 0);
exports.Entregador = Entregador = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'entregadores' })
], Entregador);
exports.EntregadorSchema = mongoose_1.SchemaFactory.createForClass(Entregador).index({
    localizacao: '2dsphere',
});
exports.EntregadorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
//# sourceMappingURL=entregador.schema.js.map