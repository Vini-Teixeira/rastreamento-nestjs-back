import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
// O AuthController foi removido ou esvaziado, então não precisamos mais dele aqui.
// import { AuthController } from './auth.controller'; 
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { WsAuthGuard } from './guards/ws-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],

  controllers: [], 
  providers: [AuthService, JwtStrategy, JwtAuthGuard, WsAuthGuard],
  exports: [AuthService, PassportModule, JwtModule, JwtAuthGuard, WsAuthGuard],
})
export class AuthModule {}