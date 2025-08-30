"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregasModule = void 0;
const common_1 = require("@nestjs/common");
const entregas_service_1 = require("./entregas.service");
const entregas_controller_1 = require("./entregas.controller");
const mongoose_1 = require("@nestjs/mongoose");
const auth_module_1 = require("../auth/auth.module");
const google_maps_module_1 = require("../google-maps/google-maps.module");
const entregadores_module_1 = require("../entregadores/entregadores.module");
const delivery_schema_1 = require("./schemas/delivery.schema");
const firebase_module_1 = require("../auth/firebase.module");
let EntregasModule = class EntregasModule {
};
exports.EntregasModule = EntregasModule;
exports.EntregasModule = EntregasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            firebase_module_1.FirebaseModule,
            mongoose_1.MongooseModule.forFeature([
                { name: delivery_schema_1.Delivery.name, schema: delivery_schema_1.DeliverySchema }
            ]),
            google_maps_module_1.GoogleMapsModule,
            (0, common_1.forwardRef)(() => entregadores_module_1.EntregadoresModule),
            auth_module_1.AuthModule,
        ],
        controllers: [entregas_controller_1.EntregasController],
        providers: [entregas_service_1.EntregasService],
        exports: [entregas_service_1.EntregasService]
    })
], EntregasModule);
//# sourceMappingURL=entregas.module.js.map