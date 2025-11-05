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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const admin = require("firebase-admin");
const firebase_admin_provider_1 = require("./firebase-admin.provider");
const common_2 = require("@nestjs/common");
const admin_schema_1 = require("../admin/schemas/admin.schema");
let AuthService = class AuthService {
    constructor(jwtService, firebase, adminModel) {
        this.jwtService = jwtService;
        this.firebase = firebase;
        this.adminModel = adminModel;
    }
    async loginDriver(driver) {
        if (!driver?._id || !driver?.telefone) {
            throw new common_1.UnauthorizedException('Dados do entregador incompletos para geração do token.');
        }
        const payload = {
            sub: String(driver._id),
            telefone: String(driver.telefone),
            role: driver.role,
        };
        const accessToken = this.jwtService.sign(payload);
        let firebaseToken;
        try {
            const uid = String(driver._id);
            const customClaims = {
                role: driver.role,
            };
            firebaseToken = await this.firebase.auth().createCustomToken(uid, customClaims);
        }
        catch (error) {
            console.error('FIREBASE_AUTH_ERROR: Falha ao criar custom token', error);
            throw new common_1.BadRequestException('Falha ao gerar token de autenticação secundária (Firebase).');
        }
        return {
            access_token: accessToken,
            firebase_token: firebaseToken,
        };
    }
    async loginLojista(lojista) {
        if (!lojista?._id || !lojista?.email) {
            throw new common_1.UnauthorizedException('Dados do lojista incompletos para geração do token.');
        }
        const payload = {
            sub: String(lojista._id),
            email: String(lojista.email),
            nome: String(lojista.nomeFantasia),
            role: lojista.role
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
    async loginComFirebaseToken(firebaseToken) {
        try {
            const decodedToken = await this.firebase.auth().verifyIdToken(firebaseToken);
            const email = decodedToken.email;
            const adminUser = await this.adminModel.findOne({ email }).exec();
            if (!adminUser) {
                throw new common_1.UnauthorizedException('Administrador não encontrado');
            }
            const payload = {
                sub: decodedToken.uid,
                email: email,
                role: 'admin'
            };
            return {
                access_token: this.jwtService.sign(payload)
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token do Firebase inválido ou expirado');
        }
    }
    async registerAdminWithFirebaseToken(firebaseToken) {
        try {
            const decodedToken = await this.firebase.auth().verifyIdToken(firebaseToken);
            const { email, name } = decodedToken;
            if (!email) {
                throw new common_1.BadRequestException('O token do Firebase não contém um email');
            }
            const existingAdmin = await this.adminModel.findOne({ email }).exec();
            if (existingAdmin) {
                return existingAdmin;
            }
            const newAdmin = new this.adminModel({
                email,
                nome: name || email,
                role: 'admin'
            });
            return newAdmin.save();
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token do Firebase inválido ou falha no registro do Admin.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(firebase_admin_provider_1.FIREBASE_ADMIN)),
    __param(2, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __metadata("design:paramtypes", [jwt_1.JwtService, Object, mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map