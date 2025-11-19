"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocorroModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const socorro_schema_1 = require("./schemas/socorro.schema");
const socorros_controller_1 = require("./socorros.controller");
const socorros_service_1 = require("./socorros.service");
const google_maps_module_1 = require("../google-maps/google-maps.module");
const entregas_module_1 = require("../entregas/entregas.module");
const entregadores_module_1 = require("../entregadores/entregadores.module");
const entregador_schema_1 = require("../entregadores/schemas/entregador.schema");
const lojistas_module_1 = require("../lojistas/lojistas.module");
const fcm_module_1 = require("../fcm/fcm.module");
let SocorroModule = class SocorroModule {
};
exports.SocorroModule = SocorroModule;
exports.SocorroModule = SocorroModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: socorro_schema_1.Socorro.name, schema: socorro_schema_1.SocorroSchema },
                { name: entregador_schema_1.Entregador.name, schema: entregador_schema_1.EntregadorSchema }
            ]),
            google_maps_module_1.GoogleMapsModule,
            fcm_module_1.FcmModule,
            (0, common_1.forwardRef)(() => entregas_module_1.EntregasModule),
            (0, common_1.forwardRef)(() => entregadores_module_1.EntregadoresModule),
            (0, common_1.forwardRef)(() => lojistas_module_1.LojistasModule)
        ],
        controllers: [socorros_controller_1.SocorrosController],
        providers: [socorros_service_1.SocorrosService],
        exports: [socorros_service_1.SocorrosService,
            mongoose_1.MongooseModule.forFeature([{ name: socorro_schema_1.Socorro.name, schema: socorro_schema_1.SocorroSchema }])
        ]
    })
], SocorroModule);
//# sourceMappingURL=socorro.module.js.map