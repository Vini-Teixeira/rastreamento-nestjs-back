"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const request_logger_middleware_1 = require("./common/middleware/request-logger.middleware");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const entregadores_module_1 = require("./entregadores/entregadores.module");
const entregas_module_1 = require("./entregas/entregas.module");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const google_maps_module_1 = require("./google-maps/google-maps.module");
const google_maps_service_1 = require("./google-maps/google-maps.service");
const auth_module_1 = require("./auth/auth.module");
const lojistas_module_1 = require("./lojistas/lojistas.module");
const firebase_module_1 = require("./auth/firebase.module");
const geocoding_controller_1 = require("./geocoding/geocoding.controller");
const schedule_1 = require("@nestjs/schedule");
const directions_module_1 = require("./directions/directions.module");
const admin_module_1 = require("./admin/admin.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const flexible_auth_guard_1 = require("./auth/flexible-auth.guard");
const admin_auth_guard_1 = require("./auth/guards/admin-auth.guard");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const firebase_auth_guard_1 = require("./auth/firebase-auth/firebase-auth.guard");
const auth_service_1 = require("./auth/auth.service");
const jwt_strategy_1 = require("./auth/jwt.strategy");
const socorro_module_1 = require("./socorros/socorro.module");
const ponto_history_module_1 = require("./ponto-history/ponto-history.module");
const fcm_module_1 = require("./fcm/fcm.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_logger_middleware_1.RequestLoggerMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    uri: configService.get('DATABASE_URL'),
                }),
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            entregadores_module_1.EntregadoresModule,
            google_maps_module_1.GoogleMapsModule,
            entregas_module_1.EntregasModule,
            auth_module_1.AuthModule,
            lojistas_module_1.LojistasModule,
            firebase_module_1.FirebaseModule,
            directions_module_1.DirectionsModule,
            admin_module_1.AdminModule,
            dashboard_module_1.DashboardModule,
            socorro_module_1.SocorroModule,
            ponto_history_module_1.PontoHistoryModule,
            fcm_module_1.FcmModule
        ],
        controllers: [app_controller_1.AppController, geocoding_controller_1.GeocodingController],
        providers: [
            app_service_1.AppService,
            google_maps_service_1.GoogleMapsService,
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            flexible_auth_guard_1.FlexibleAuthGuard,
            admin_auth_guard_1.AdminAuthGuard,
            jwt_auth_guard_1.JwtAuthGuard,
            firebase_auth_guard_1.FirebaseAuthGuard,
        ],
        exports: [auth_service_1.AuthService, flexible_auth_guard_1.FlexibleAuthGuard, admin_auth_guard_1.AdminAuthGuard],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map