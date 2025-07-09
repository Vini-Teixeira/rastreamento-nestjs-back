"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAdminProvider = exports.FIREBASE_ADMIN = void 0;
const admin = require("firebase-admin");
exports.FIREBASE_ADMIN = 'FIREBASE_ADMIN';
exports.FirebaseAdminProvider = {
    provide: exports.FIREBASE_ADMIN,
    useFactory: () => {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('As variáveis de ambiente do Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão definidas. Verifique seu arquivo .env.');
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
            console.log('>>> Firebase Admin inicializado com sucesso a partir das variáveis de ambiente!');
        }
        return admin;
    },
};
//# sourceMappingURL=firebase-admin.provider.js.map