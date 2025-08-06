import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { LojistasModule } from 'src/lojistas/lojistas.module';
import { EntregadoresModule } from 'src/entregadores/entregadores.module';
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
    LojistasModule,
    EntregadoresModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    WsAuthGuard,
  ],
  exports: [PassportModule, AuthService, JwtAuthGuard, WsAuthGuard],
})
export class AuthModule {}