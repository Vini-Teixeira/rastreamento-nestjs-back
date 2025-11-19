"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LojistasModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const lojistas_service_1 = require("./lojistas.service");
const lojistas_controller_1 = require("./lojistas.controller");
const lojista_schema_1 = require("./schemas/lojista.schema");
const socorro_module_1 = require("../socorros/socorro.module");
const jwt_1 = require("@nestjs/jwt");
const auth_module_1 = require("../auth/auth.module");
const google_maps_module_1 = require("../google-maps/google-maps.module");
const delivery_schema_1 = require("../entregas/schemas/delivery.schema");
const socorro_schema_1 = require("../socorros/schemas/socorro.schema");
let LojistasModule = class LojistasModule {
};
exports.LojistasModule = LojistasModule;
exports.LojistasModule = LojistasModule = __decorate([
    (0, common_1.Module)({
        imports: [google_maps_module_1.GoogleMapsModule,
            auth_module_1.AuthModule,
            jwt_1.JwtModule,
            (0, common_1.forwardRef)(() => socorro_module_1.SocorroModule),
            mongoose_1.MongooseModule.forFeature([
                { name: lojista_schema_1.Lojista.name, schema: lojista_schema_1.LojistaSchema },
                { name: delivery_schema_1.Delivery.name, schema: delivery_schema_1.DeliverySchema },
                { name: socorro_schema_1.Socorro.name, schema: socorro_schema_1.SocorroSchema },
            ]),
        ],
        controllers: [lojistas_controller_1.LojistasController],
        providers: [lojistas_service_1.LojistasService],
        exports: [lojistas_service_1.LojistasService, mongoose_1.MongooseModule],
    })
], LojistasModule);
//# sourceMappingURL=lojistas.module.js.map