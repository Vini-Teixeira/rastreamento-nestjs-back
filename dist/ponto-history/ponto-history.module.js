"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PontoHistoryModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const ponto_history_schema_1 = require("./schemas/ponto-history.schema");
const ponto_history_service_1 = require("./ponto-history.service");
let PontoHistoryModule = class PontoHistoryModule {
};
exports.PontoHistoryModule = PontoHistoryModule;
exports.PontoHistoryModule = PontoHistoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: ponto_history_schema_1.PontoHistory.name, schema: ponto_history_schema_1.PontoHistorySchema }]),
        ],
        providers: [ponto_history_service_1.PontoHistoryService],
        exports: [mongoose_1.MongooseModule, ponto_history_service_1.PontoHistoryService]
    })
], PontoHistoryModule);
//# sourceMappingURL=ponto-history.module.js.map