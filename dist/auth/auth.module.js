"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_1 = require("@nestjs/jwt");
const jwt_strategy_1 = require("./jwt.strategy");
const firebase_module_1 = require("./firebase.module");
const passport_1 = require("@nestjs/passport");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const firebase_auth_guard_1 = require("./firebase-auth/firebase-auth.guard");
const flexible_auth_guard_1 = require("./flexible-auth.guard");
const ws_auth_guard_1 = require("./guards/ws-auth.guard");
const admin_module_1 = require("../admin/admin.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [firebase_module_1.FirebaseModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: { expiresIn: '7d' },
                }),
            }),
            admin_module_1.AdminModule],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy, jwt_auth_guard_1.JwtAuthGuard, firebase_auth_guard_1.FirebaseAuthGuard, flexible_auth_guard_1.FlexibleAuthGuard, ws_auth_guard_1.WsAuthGuard],
        exports: [auth_service_1.AuthService, passport_1.PassportModule, jwt_1.JwtModule, jwt_auth_guard_1.JwtAuthGuard, firebase_auth_guard_1.FirebaseAuthGuard, flexible_auth_guard_1.FlexibleAuthGuard, ws_auth_guard_1.WsAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map