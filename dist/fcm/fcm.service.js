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
var FcmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firebase_admin_provider_1 = require("../auth/firebase-admin.provider");
let FcmService = FcmService_1 = class FcmService {
    constructor(firebase) {
        this.firebase = firebase;
        this.logger = new common_1.Logger(FcmService_1.name);
    }
    async sendPushNotification(fcmToken, title, body, data) {
        if (!fcmToken) {
            this.logger.warn('Tentativa de enviar notificação push sem um fcmToken.');
            return;
        }
        const message = {
            token: fcmToken,
            notification: {
                title,
                body,
            },
            data,
            android: {
                priority: 'high',
                notification: {
                    sound: 'notification_sound',
                    channelId: 'high_importance_channel',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        contentAvailable: true,
                    },
                },
            },
        };
        try {
            await this.firebase.messaging().send(message);
            this.logger.log(`Notificação push (com som) enviada com sucesso para o token: ...${fcmToken.slice(-10)}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar notificação push: ${error}`);
        }
    }
};
exports.FcmService = FcmService;
exports.FcmService = FcmService = FcmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(firebase_admin_provider_1.FIREBASE_ADMIN)),
    __metadata("design:paramtypes", [Object])
], FcmService);
//# sourceMappingURL=fcm.service.js.map