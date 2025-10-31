import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseModule } from './firebase.module';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';
import { FlexibleAuthGuard } from './flexible-auth.guard';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { AdminModule } from 'src/admin/admin.module';

@Module({
  imports: [FirebaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    AdminModule
  ],

  controllers: [AuthController], 
  providers: [AuthService, JwtStrategy, JwtAuthGuard, FirebaseAuthGuard, FlexibleAuthGuard, WsAuthGuard],
  exports: [AuthService, PassportModule, JwtModule, JwtAuthGuard, FirebaseAuthGuard, FlexibleAuthGuard, WsAuthGuard],
})
export class AuthModule {}