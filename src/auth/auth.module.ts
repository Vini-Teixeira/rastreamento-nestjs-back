import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { EntregadoresModule } from 'src/entregadores/entregadores.module';
import { LojistasModule } from 'src/lojistas/lojistas.module';
import { FirebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    LojistasModule,
    forwardRef(() => EntregadoresModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAdminProvider,
    FirebaseAuthGuard,
    JwtStrategy,
  ],
  exports: [FirebaseAdminProvider, FirebaseAuthGuard, PassportModule, JwtModule], 
})
export class AuthModule {}
