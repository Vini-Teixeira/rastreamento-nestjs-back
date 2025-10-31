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
exports.PontoHistorySchema = exports.PontoHistory = exports.PontoAction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var PontoAction;
(function (PontoAction) {
    PontoAction["LOGIN"] = "login";
    PontoAction["LOGOUT"] = "logout";
})(PontoAction || (exports.PontoAction = PontoAction = {}));
let PontoHistory = class PontoHistory extends mongoose_2.Document {
};
exports.PontoHistory = PontoHistory;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Entregador', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PontoHistory.prototype, "driverId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(PontoAction), required: true }),
    __metadata("design:type", String)
], PontoHistory.prototype, "action", void 0);
exports.PontoHistory = PontoHistory = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PontoHistory);
exports.PontoHistorySchema = mongoose_1.SchemaFactory.createForClass(PontoHistory);
exports.PontoHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
//# sourceMappingURL=ponto-history.schema.js.map