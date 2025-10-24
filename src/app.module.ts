import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntregadoresModule } from './entregadores/entregadores.module';
import { EntregasModule } from './entregas/entregas.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { GoogleMapsService } from './google-maps/google-maps.service';
import { AuthModule } from './auth/auth.module';
import { LojistasModule } from './lojistas/lojistas.module';
import { FirebaseModule } from './auth/firebase.module';
import { GeocodingController } from './geocoding/geocoding.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { DirectionsModule } from './directions/directions.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FlexibleAuthGuard } from './auth/flexible-auth.guard';
import { AdminAuthGuard } from './auth/guards/admin-auth.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { FirebaseAuthGuard } from './auth/firebase-auth/firebase-auth.guard';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { SocorroModule } from './socorros/socorro.module';
import { PontoHistoryModule } from './ponto-history/ponto-history.module';
import { FcmModule } from './fcm/fcm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],

    }),
    ScheduleModule.forRoot(),
    EntregadoresModule,
    GoogleMapsModule,
    EntregasModule,
    AuthModule,
    LojistasModule,
    FirebaseModule,
    DirectionsModule,
    AdminModule,
    DashboardModule,
    SocorroModule,
    PontoHistoryModule,
    FcmModule
  ],
  controllers: [AppController, GeocodingController],
  providers: [
    AppService,
    GoogleMapsService,
    AuthService,
    JwtStrategy,
    FlexibleAuthGuard,
    AdminAuthGuard,
    JwtAuthGuard,
    FirebaseAuthGuard,
  ],
  exports: [AuthService, FlexibleAuthGuard, AdminAuthGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
