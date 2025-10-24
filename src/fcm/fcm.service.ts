import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from 'src/auth/firebase-admin.provider';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
  ) {}

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data: { [key: string]: string },
  ) {
    if (!fcmToken) {
      this.logger.warn('Tentativa de enviar notificação push sem um fcmToken.');
      return;
    }

    const message: admin.messaging.Message = {
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
      this.logger.log(
        `Notificação push (com som) enviada com sucesso para o token: ...${fcmToken.slice(-10)}`,
      );
    } catch (error) {
      this.logger.error(`Falha ao enviar notificação push: ${error}`);
    }
  }
}
