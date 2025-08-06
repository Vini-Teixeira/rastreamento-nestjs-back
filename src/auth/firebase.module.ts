import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminProvider } from './firebase-admin.provider';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseAdminProvider],
  exports: [FirebaseAdminProvider],
})
export class FirebaseModule {}
