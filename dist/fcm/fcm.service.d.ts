import * as admin from 'firebase-admin';
export declare class FcmService {
    private readonly firebase;
    private readonly logger;
    constructor(firebase: admin.app.App);
    sendPushNotification(fcmToken: string, title: string, body: string, data: {
        [key: string]: string;
    }): Promise<void>;
}
