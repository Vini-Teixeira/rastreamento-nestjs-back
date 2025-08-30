"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAdminProvider = exports.FIREBASE_ADMIN = void 0;
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
exports.FIREBASE_ADMIN = 'FIREBASE_ADMIN';
exports.FirebaseAdminProvider = {
    provide: exports.FIREBASE_ADMIN,
    inject: [config_1.ConfigService],
    useFactory: (configService) => {
        const projectId = configService.get('FIREBASE_PROJECT_ID');
        const clientEmail = configService.get('FIREBASE_CLIENT_EMAIL');
        const privateKey = configService.get('FIREBASE_PRIVATE_KEY');
        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('As variáveis de ambiente do Firebase não estão definidas. Verifique a configuração do serviço.');
        }
        const serviceAccount = {
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        };
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('>>> Firebase Admin inicializado com sucesso a partir do ConfigService!');
        }
        return admin;
    },
};
//# sourceMappingURL=firebase-admin.provider.js.map