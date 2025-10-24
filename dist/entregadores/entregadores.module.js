"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregadoresModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const entregadores_service_1 = require("./entregadores.service");
const entregadores_controller_1 = require("./entregadores.controller");
const entregadores_gateway_1 = require("./entregadores.gateway");
const auth_module_1 = require("../auth/auth.module");
const firebase_module_1 = require("../auth/firebase.module");
const ponto_history_module_1 = require("../ponto-history/ponto-history.module");
const entregador_schema_1 = require("./schemas/entregador.schema");
const delivery_schema_1 = require("../entregas/schemas/delivery.schema");
const socorro_schema_1 = require("../socorros/schemas/socorro.schema");
const entregas_module_1 = require("../entregas/entregas.module");
const EntregadorMongooseModule = mongoose_1.MongooseModule.forFeature([
    { name: entregador_schema_1.Entregador.name, schema: entregador_schema_1.EntregadorSchema }
]);
let EntregadoresModule = class EntregadoresModule {
};
exports.EntregadoresModule = EntregadoresModule;
exports.EntregadoresModule = EntregadoresModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: entregador_schema_1.Entregador.name, schema: entregador_schema_1.EntregadorSchema },
                { name: delivery_schema_1.Delivery.name, schema: delivery_schema_1.DeliverySchema },
                { name: socorro_schema_1.Socorro.name, schema: socorro_schema_1.SocorroSchema },
            ]),
            firebase_module_1.FirebaseModule,
            ponto_history_module_1.PontoHistoryModule,
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            (0, common_1.forwardRef)(() => entregas_module_1.EntregasModule)
        ],
        controllers: [entregadores_controller_1.EntregadoresController],
        providers: [entregadores_service_1.EntregadoresService, entregadores_gateway_1.EntregadoresGateway],
        exports: [entregadores_service_1.EntregadoresService, entregadores_gateway_1.EntregadoresGateway, EntregadorMongooseModule, mongoose_1.MongooseModule],
    })
], EntregadoresModule);
//# sourceMappingURL=entregadores.module.js.map