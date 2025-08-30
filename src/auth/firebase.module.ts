import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminProvider, FIREBASE_ADMIN } from './firebase-admin.provider';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseAdminProvider],
  exports: [FIREBASE_ADMIN], 
})
export class FirebaseModule {}
